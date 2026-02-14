use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, PhysicalPosition, PhysicalSize, Wry,
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

// command to show the window
#[tauri::command]
fn show_window(app: AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

// command to check if window is visible
#[tauri::command]
fn is_window_visible(app: AppHandle) -> bool {
    if let Some(window) = app.get_webview_window("main") {
        window.is_visible().unwrap_or(false)
    } else {
        false
    }
}

// command to set tray icon badge (for unread notifications)
#[tauri::command]
fn set_tray_badge(app: AppHandle, has_unread: bool) {
    use tauri::image::Image;

    // get the tray icon from app state
    if let Some(tray) = app.try_state::<tauri::tray::TrayIcon>() {
        if has_unread {
            // load the badge icon
            let icon_path = app
                .path()
                .resource_dir()
                .ok()
                .and_then(|dir| Some(dir.join("icons/icon-badge.png")))
                .and_then(|path| Image::from_path(&path).ok());

            if let Some(icon) = icon_path {
                let _ = tray.set_icon(Some(icon));
            }
        } else {
            // restore the original icon
            if let Some(default_icon) = app.default_window_icon() {
                let _ = tray.set_icon(Some(default_icon.clone()));
            }
        }
    }
}

// command to save window size (can be called from frontend)
#[tauri::command]
fn save_size(app: AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        save_window_size(&app, &window);
    }
}

// command to show about window
#[tauri::command]
fn show_about(app: AppHandle) {
    if let Some(window) = app.get_webview_window("about") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

// command to show settings view
#[tauri::command]
fn show_settings(app: AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        // emit event to frontend to switch to settings view
        let _ = window.emit("show-settings", ());
        let _ = window.show();
        let _ = window.set_focus();
    }
}

// command to open config file
#[tauri::command]
fn open_config(app: AppHandle) {
    use tauri_plugin_opener::OpenerExt;
    
    // get the path to settings.json
    if let Ok(app_data_dir) = app.path().app_data_dir() {
        let config_path = app_data_dir.join("settings.json");
        
        // open with default editor
        let _ = app.opener().open_path(config_path.to_string_lossy().to_string(), None::<&str>);
    }
}

// command to get config path for debugging
#[tauri::command]
fn get_config_path(app: AppHandle) -> String {
    if let Ok(app_data_dir) = app.path().app_data_dir() {
        let config_path = app_data_dir.join("settings.json");
        config_path.to_string_lossy().to_string()
    } else {
        "Error getting path".to_string()
    }
}

// command to get all settings
#[tauri::command]
fn get_settings(app: AppHandle) -> serde_json::Value {
    use std::fs;
    
    // read the settings file directly
    if let Ok(app_data_dir) = app.path().app_data_dir() {
        let settings_path = app_data_dir.join("settings.json");
        if let Ok(contents) = fs::read_to_string(settings_path) {
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&contents) {
                return json;
            }
        }
    }
    serde_json::json!({})
}

// command to set a setting value
#[tauri::command]
fn set_setting(app: AppHandle, key: String, value: serde_json::Value) {
    if let Ok(store) = app.store("settings.json") {
        let _ = store.set(key, value);
        let _ = store.save();
    }
}

// command to get a single setting value
#[tauri::command]
fn get_setting(app: AppHandle, key: String) -> Option<serde_json::Value> {
    if let Ok(store) = app.store("settings.json") {
        return store.get(&key).map(|v| v.clone());
    }
    None
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
                let window_size = window
                    .outer_size()
                    .unwrap_or_else(|_| PhysicalSize::new(600, 400));

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

            // clear tray badge when showing window
            if let Some(tray) = app.try_state::<tauri::tray::TrayIcon>() {
                if let Some(default_icon) = app.default_window_icon() {
                    let _ = tray.set_icon(Some(default_icon.clone()));
                }
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_pty::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            close_window,
            save_size,
            show_window,
            is_window_visible,
            set_tray_badge,
            show_about,
            show_settings,
            open_config,
            get_config_path,
            get_settings,
            set_setting,
            get_setting
        ])
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

            // build tray menu
            let about_item = MenuItemBuilder::with_id("about", "About Barterm").build(app)?;
            let settings_item = MenuItemBuilder::with_id("settings", "Settings").build(app)?;
            let open_config_item = MenuItemBuilder::with_id("open_config", "Open Config").build(app)?;
            let quit_item = MenuItemBuilder::with_id("quit", "Quit").build(app)?;
            
            let menu = MenuBuilder::new(app)
                .item(&about_item)
                .item(&settings_item)
                .item(&open_config_item)
                .separator()
                .item(&quit_item)
                .build()?;

            // build tray icon
            let tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "about" => {
                        if let Some(window) = app.get_webview_window("about") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "settings" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.emit("show-settings", ());
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "open_config" => {
                        use tauri_plugin_opener::OpenerExt;
                        
                        // get the path to settings.json
                        if let Ok(app_data_dir) = app.path().app_data_dir() {
                            let config_path = app_data_dir.join("settings.json");
                            
                            // open with default editor
                            let _ = app.opener().open_path(config_path.to_string_lossy().to_string(), None::<&str>);
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
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
