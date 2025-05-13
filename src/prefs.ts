import Gio from 'gi://Gio'
import Adw from 'gi://Adw'
import Gtk from 'gi://Gtk'

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js'

import * as Constants from './constants.js'
import {DeviceSettings, DeviceType} from "./deviceSettings.js";
import {buildShortcutButtonRow} from "./keymapButton.js";

export default class AudioSwitchShortcutsPreferences extends ExtensionPreferences {

    fillPreferencesWindow(window: Adw.PreferencesWindow): Promise<void> {
        const gnomeSettings = this.getSettings()
        const deviceSettings = new DeviceSettings(gnomeSettings)

        window.add(this.outputPage(gnomeSettings, deviceSettings))
        window.add(this.inputPage(gnomeSettings, deviceSettings))
        window.add(this.miscPage(gnomeSettings))

        return Promise.resolve()
    }

    outputPage(gnomeSettings: Gio.Settings, deviceSettings: DeviceSettings): Adw.PreferencesPage {

        const page = new Adw.PreferencesPage({
            title: _('Audio Outputs'),
            icon_name: 'audio-speakers-symbolic',
        })

        const shortcutGroup = new Adw.PreferencesGroup({
            title: _('Audio Output Shortcuts')
        })
        page.add(shortcutGroup)

        const keyboardRow = buildShortcutButtonRow(
            Constants.KEY_OUTPUT_HOTKEY,
            gnomeSettings,
            _('Keyboard shortcut'),
            _('Switch to next audio output device'),
        );
        shortcutGroup.add(keyboardRow)

        const devicesGroup = new Adw.PreferencesGroup({
            title: _('Audio Devices'),
            description: _('Select the devices to cycle through when the keyboard shortcut is pressed. Drag them to set the order.')
        })
        page.add(devicesGroup)

        this.createDeviceList(devicesGroup, deviceSettings, DeviceType.OUTPUT)

        return page
    }
    
    inputPage(gnomeSettings: Gio.Settings, deviceSettings: DeviceSettings): Adw.PreferencesPage {

        const page = new Adw.PreferencesPage({
            title: _('Audio Inputs'),
            icon_name: 'audio-input-microphone-symbolic',
        })

        const shortcutGroup = new Adw.PreferencesGroup({
            title: _('Audio Input Shortcuts')
        })
        page.add(shortcutGroup)

        const keyboardRow = buildShortcutButtonRow(
            Constants.KEY_INPUT_HOTKEY,
            gnomeSettings,
            _('Keyboard shortcut'),
            _('Switch to next audio input device'),
        );
        shortcutGroup.add(keyboardRow)

        const devicesGroup = new Adw.PreferencesGroup({
            title: _('Audio Devices'),
            description: _('Select the devices to cycle through when the keyboard shortcut is pressed. Drag them to set the order.')
        })
        page.add(devicesGroup)

        this.createDeviceList(devicesGroup, deviceSettings, DeviceType.INPUT)

        return page
    }

    private createDeviceList(group: Adw.PreferencesGroup, deviceSettings: DeviceSettings, deviceType: DeviceType) {
        deviceSettings.getActiveDevices(deviceType).forEach(device => {
            const row = new Adw.SwitchRow({
                title: device.name,
                active: device.cycled
            })
            row.add_prefix(new Gtk.Image({
                icon_name: 'list-drag-handle-symbolic',
                css_classes: ['dim-label']
            }))
            row.connect('notify::active', source => {
                deviceSettings.setCycled(device.name, device.type, source.get_active())
            })

            group.add(row)
        })
    }

    miscPage(settings: Gio.Settings): Adw.PreferencesPage {
        const page = new Adw.PreferencesPage({
            title: _('Settings'),
            icon_name: 'applications-system-symbolic',
        })

        const group = new Adw.PreferencesGroup({
            title: _('Appearance'),
            description: _('Configure the appearance of this extension'),
        })
        page.add(group)

        // Create a new preferences row
        const indicator = new Adw.SwitchRow({
            title: _('Show Indicator'),
            subtitle: _('Show a tray icon, to get to settings quicker'),
        })
        group.add(indicator)

        const notifications = new Adw.SwitchRow({
            title: _('Show Notifications'),
            subtitle: _('Display a notification message when you press a shortcut'),
        })
        group.add(notifications)

        settings!.bind(Constants.KEY_INDICATOR, indicator, 'active', Gio.SettingsBindFlags.DEFAULT)
        settings!.bind(Constants.KEY_NOTIFICATIONS, notifications, 'active', Gio.SettingsBindFlags.DEFAULT)

        return page
    }
    
}