use tauri::{
    AppHandle, Manager, PhysicalPosition, Wry,
    tray::{TrayIconBuilder, TrayIconEvent},
};

#[cfg(target_os = "macos")]
use tauri::ActivationPolicy;

// toggle window visibility and position it below tray icon
fn toggle_window(app: &AppHandle<Wry>, tray_icon: &tauri::tray::TrayIcon) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            // show and focus window (positioning is handled by the window manager)
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
        .setup(|app| {
            // set activation policy to Accessory (hide dock icon on macOS)
            #[cfg(target_os = "macos")]
            app.set_activation_policy(ActivationPolicy::Accessory);
            
            // build tray icon
            let tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { .. } = event {
                        let app = tray.app_handle();
                        toggle_window(app, tray);
                    }
                })
                .build(app)?;
            
            // store tray icon in app state
            app.manage(tray);
            
            // listen for window blur to hide window
            if let Some(window) = app.get_webview_window("main") {
                let app_handle = app.handle().clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::Focused(focused) = event {
                        if !focused {
                            if let Some(win) = app_handle.get_webview_window("main") {
                                let _ = win.hide();
                            }
                        }
                    }
                });
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
