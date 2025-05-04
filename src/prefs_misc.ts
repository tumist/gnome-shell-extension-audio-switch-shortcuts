import Gio from 'gi://Gio';
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class PreferencesMisc {

    createPage(): Adw.PreferencesPage {

        const page = new Adw.PreferencesPage({
            title: _('Settings'),
            icon_name: 'applications-system-symbolic',
        });

        const group = new Adw.PreferencesGroup({
            title: _('Appearance'),
            description: _('Configure the appearance of the extension'),
        });
        page.add(group);

        // Create a new preferences row
        const indicator = new Adw.SwitchRow({
            title: _('Show Indicator'),
            subtitle: _('Whether to show the panel indicator'),
        });
        group.add(indicator);

        //this.settings!.bind('show-indicator', indicator, 'active', Gio.SettingsBindFlags.DEFAULT);

        return page;
    }
}