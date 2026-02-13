use tauri::{
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, PhysicalPosition, Wry,
};

#[cfg(target_os = "macos")]
use tauri::ActivationPolicy;

// command to hide the window
#[tauri::command]
fn close_window(app: AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
    }
}

// toggle window visibility and position it below tray icon
fn toggle_window(app: &AppHandle<Wry>, tray_icon: &tauri::tray::TrayIcon) {
    if let Some(window) = app.get_webview_window("main") {
        let is_visible = window.is_visible().unwrap_or(false);

        if is_visible {
            let _ = window.hide();
        } else {
            // position window below tray icon
            if let Ok(Some(tray_rect)) = tray_icon.rect() {
                let window_size = window.outer_size().unwrap_or_else(|_| {
                    use tauri::PhysicalSize;
                    PhysicalSize::new(600, 400)
                });
                
                // extract position and size from rect
                let tauri::Rect { position, size } = tray_rect;
                
                // pattern match to get physical coordinates
                if let (tauri::Position::Physical(pos), tauri::Size::Physical(sz)) = (position, size) {
                    // center window horizontally relative to tray icon
                    let tray_center_x = pos.x as f64 + (sz.width as f64 / 2.0);
                    let x = (tray_center_x - (window_size.width as f64 / 2.0)) as i32;
                    let y = pos.y + sz.height as i32 + 5; // 5px gap below tray
                    
                    let _ = window.set_position(PhysicalPosition::new(x, y));
                }
            }

            let _ = window.show();
            let _ = window.set_focus();
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_pty::init())
        .invoke_handler(tauri::generate_handler![close_window])
        .setup(|app| {
            // set activation policy to Accessory (hide dock icon on macOS)
            #[cfg(target_os = "macos")]
            app.set_activation_policy(ActivationPolicy::Accessory);

            // build tray icon
            let tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .on_tray_icon_event(|tray, event| {
                    // only respond to left click release
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        toggle_window(app, tray);
                    }
                })
                .build(app)?;

            // store tray icon in app state
            app.manage(tray);

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
