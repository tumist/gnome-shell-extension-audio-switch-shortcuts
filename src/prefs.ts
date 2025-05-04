import Gio from 'gi://Gio';
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';


import PreferencesOutput from "./prefs_output.js";
import PreferencesInput from "./prefs_input.js";
import PreferencesMisc from "./prefs_misc.js";

export default class AudioSwitchShortcutsPreferences extends ExtensionPreferences {
    private settings?: Gio.Settings

    fillPreferencesWindow(window: Adw.PreferencesWindow): Promise<void> {
        this.settings = this.getSettings();

        const output = new PreferencesOutput();
        const input = new PreferencesInput();
        const misc = new PreferencesMisc();

        window.add(output.createPage());
        window.add(input.createPage());
        window.add(misc.createPage());

        return Promise.resolve();
    }
}