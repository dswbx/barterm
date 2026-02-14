use tauri::{
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, PhysicalPosition, PhysicalSize, Wry,
};
use tauri_plugin_store::StoreExt;

#[cfg(target_os = "macos")]
use tauri::ActivationPolicy;

use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

// command to hide the window
#[tauri::command]
fn close_window(app: AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        // save window size before hiding
        save_window_size(&app, &window);
        let _ = window.hide();
    }
}

// command to save window size (can be called from frontend)
#[tauri::command]
fn save_size(app: AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        save_window_size(&app, &window);
    }
}

// save current window size to store
fn save_window_size(app: &AppHandle, window: &tauri::WebviewWindow) {
    if let Ok(size) = window.outer_size() {
        if let Ok(store) = app.store("settings.json") {
            let _ = store.set("window_width", serde_json::json!(size.width));
            let _ = store.set("window_height", serde_json::json!(size.height));
            let _ = store.save();
        }
    }
}

// toggle window visibility and position it below tray icon
fn toggle_window(app: &AppHandle<Wry>, tray_icon: &tauri::tray::TrayIcon) {
    if let Some(window) = app.get_webview_window("main") {
        let is_visible = window.is_visible().unwrap_or(false);

        if is_visible {
            // save window size before hiding
            save_window_size(app, &window);
            let _ = window.hide();
        } else {
            // position window below tray icon
            if let Ok(Some(tray_rect)) = tray_icon.rect() {
                let window_size = window.outer_size().unwrap_or_else(|_| {
                    PhysicalSize::new(600, 400)
                });

                // extract position and size from rect
                let tauri::Rect { position, size } = tray_rect;

                // pattern match to get physical coordinates
                if let (tauri::Position::Physical(pos), tauri::Size::Physical(sz)) =
                    (position, size)
                {
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
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![close_window, save_size])
        .setup(|app| {
            // set activation policy to Accessory (hide dock icon on macOS)
            #[cfg(target_os = "macos")]
            app.set_activation_policy(ActivationPolicy::Accessory);

            // initialize store
            let store = app.store("settings.json").expect("failed to create store");
            
            // restore saved window size
            if let Some(window) = app.get_webview_window("main") {
                if let Some(width) = store.get("window_width").and_then(|v| v.as_u64()) {
                    if let Some(height) = store.get("window_height").and_then(|v| v.as_u64()) {
                        let size = PhysicalSize::new(width as u32, height as u32);
                        let _ = window.set_size(size);
                    }
                }
                
                // listen for resize events to save size (with debounce)
                let app_handle = app.handle().clone();
                let last_resize = Arc::new(Mutex::new(Instant::now()));
                
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::Resized(_) = event {
                        let mut last = last_resize.lock().unwrap();
                        *last = Instant::now();
                        
                        // clone for the async task
                        let app_clone = app_handle.clone();
                        let last_clone = Arc::clone(&last_resize);
                        
                        // wait 500ms before saving to debounce rapid resize events
                        std::thread::spawn(move || {
                            std::thread::sleep(Duration::from_millis(500));
                            let elapsed = last_clone.lock().unwrap().elapsed();
                            
                            // only save if no resize happened in the last 500ms
                            if elapsed >= Duration::from_millis(500) {
                                if let Some(window) = app_clone.get_webview_window("main") {
                                    save_window_size(&app_clone, &window);
                                }
                            }
                        });
                    }
                });
            }

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
