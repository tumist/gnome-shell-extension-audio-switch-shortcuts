import Gio from 'gi://Gio';
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class PreferencesInput {

    createPage(): Adw.PreferencesPage {

        const page = new Adw.PreferencesPage({
            title: _('Audio Inputs'),
            icon_name: 'audio-input-microphone-symbolic',
        });

        const shortcutGroup = new Adw.PreferencesGroup({
            title: _('Shortcuts')
        });
        page.add(shortcutGroup);

        const keyboardRow = new Adw.ActionRow({
            title: _('Keyboard shortcut'),
            subtitle: _('Switch to next audio input')
        });
        //TODO: keyboardRow.add_suffix()
        shortcutGroup.add(keyboardRow);

        const devicesGroup = new Adw.PreferencesGroup({
            title: _('Audio Devices'),
            description: _('Select the devices to cycle through when the keyboard shortcut is pressed. Drag them to set the order.')
        });
        page.add(devicesGroup);

        // TODO: Replace with actual devices
        const dev1 = new Adw.SwitchRow({
            'title': 'device 1'
        });
        dev1.add_prefix(new Gtk.Image({
            icon_name: 'list-drag-handle-symbolic',
            css_classes: ['dim-label']
        }));
        const dev2 = new Adw.SwitchRow({
            'title': 'device 2'
        });
        dev2.add_prefix(new Gtk.Image({
            icon_name: 'list-drag-handle-symbolic',
            css_classes: ['dim-label']
        }));
        const dev3 = new Adw.SwitchRow({
            'title': 'device 3'
        });
        dev3.add_prefix(new Gtk.Image({
            icon_name: 'list-drag-handle-symbolic',
            css_classes: ['dim-label']
        }));

        devicesGroup.add(dev1);
        devicesGroup.add(dev2);
        devicesGroup.add(dev3);

        return page;
    }
}