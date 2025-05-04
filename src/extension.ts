import Gio from 'gi://Gio';
import St from 'gi://St';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import {PopupMenu} from "resource:///org/gnome/shell/ui/popupMenu.js";

export default class AudioSwitchShortCutsExtension extends Extension {
    settings?: Gio.Settings
    private indicator?: PanelMenu.Button;

    enable() {
        this.settings = this.getSettings();
        this.indicator = new PanelMenu.Button(0, this.metadata.name, false);

        const icon = new St.Icon({
            icon_name: 'audio-card-symbolic',
            style_class: 'system-status-icon',
        });
        this.indicator.add_child(icon);

        Main.panel.addToStatusArea(this.uuid, this.indicator);

        const menu = new PopupMenu(this.indicator, 0.5, St.Side.TOP);

        // Add a menu item to open the preferences window
        menu.addAction(_('Preferences...'), () => this.openPreferences());
        this.indicator.setMenu(menu);

        // Create a new GSettings object, and bind the "show-indicator"
        // setting to the "visible" property.
        this.settings = this.getSettings();
        this.settings.bind('show-indicator', this.indicator, 'visible',
            Gio.SettingsBindFlags.DEFAULT);

        // Watch for changes to a specific setting
        this.settings.connect('changed::show-indicator', (settings, key) => {
            console.debug(`${key} = ${settings.get_value(key).print(true)}`);
        });

    }

    disable() {
        this.settings = undefined;
        this.indicator?.destroy();
        this.indicator = undefined;
    }

}