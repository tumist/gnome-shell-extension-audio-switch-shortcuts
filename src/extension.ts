import Gio from 'gi://Gio'
import St from 'gi://St'

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js'
import * as Main from 'resource:///org/gnome/shell/ui/main.js'
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js'
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as MessageTray from 'resource:///org/gnome/shell/ui/messageTray.js'

import * as Constants from './constants.js'
import {AudioDevice, DeviceSettings, DeviceType} from "./deviceSettings.js"
import {Action, Mixer, MixerSource, MixerSubscription} from "./mixer.js";

export default class AudioSwitchShortCutsExtension extends Extension {
    private gnomeSettings?: Gio.Settings
    private indicator?: PanelMenu.Button
    private deviceSettings?: DeviceSettings
    private mixer?: Mixer
    private mixerSubscription?: MixerSubscription

    enable() {
        this.gnomeSettings = this.getSettings()
        this.deviceSettings = new DeviceSettings(this.gnomeSettings)
        this.taskbarIcon()


        // register available devices, update the stored settings accordingly.
        new MixerSource().getMixer().then(mixer => {
            this.mixer = mixer;

            // set all devices as inactive, so that we re-set their status
            this.deviceSettings?.disableAllDevices()

            // add devices in settings
            this.mixer.getAllDevices(DeviceType.OUTPUT).forEach(device => {
                this.deviceSettings?.addOrEnableDevice(device, DeviceType.OUTPUT)
            })
            this.mixer.getAllDevices(DeviceType.INPUT).forEach(device => {
                this.deviceSettings?.addOrEnableDevice(device, DeviceType.INPUT)
            })

            // listen to devices added or removed
            this.mixerSubscription = this.mixer.subscribeToDeviceChanges(event => {
                const name = this.mixer?.getAudioDevicesFromIds([event.deviceId], event.type)

                if (name !== undefined) {
                    if (event.action === Action.ADDED) {
                        this.deviceSettings?.addOrEnableDevice(name[0], event.type)
                    } else if (event.action === Action.REMOVED) {
                        this.deviceSettings?.disableDevice(name[0], event.type)
                    }
                }

            })

        })

    }

    /**
     * Generate a Gnome notification which does not stay permanently in tray, only if notifications are enabled.
     *
     * @param device device that was just enabled
     */
    sendNotification(device: AudioDevice): void {

        if (this.gnomeSettings!.get_boolean(Constants.KEY_NOTIFICATIONS)) {
            const systemSource = MessageTray.getSystemSource();

            const title = device.deviceType == DeviceType.INPUT ? _("Audio Input") : _("Audio Output")
            const message = device.name

            const notification = new MessageTray.Notification({
                source: systemSource,
                title: title,
                body: message,
                iconName: 'audio-card-symbolic',
                urgency: MessageTray.Urgency.LOW,
                resident: false,
                isTransient: true
            })

            systemSource.addNotification(notification);

        }

    }


    taskbarIcon() {
        this.indicator = new PanelMenu.Button(0, this.metadata.name, false)

        const icon = new St.Icon({
            icon_name: 'audio-card-symbolic',
            style_class: 'system-status-icon',
        })
        this.indicator.add_child(icon)

        Main.panel.addToStatusArea(this.uuid, this.indicator)

        const menu = new PopupMenu.PopupMenu(this.indicator, 0.5, St.Side.TOP)

        // Add a menu item to open the preferences window
        menu.addAction(_('Preferences...'), () => this.openPreferences())
        this.indicator.setMenu(menu)

        // Create a new GSettings object, and bind the "show-indicator"
        // setting to the "visible" property.
        this.gnomeSettings = this.getSettings()
        this.gnomeSettings.bind('show-indicator', this.indicator, 'visible',
            Gio.SettingsBindFlags.DEFAULT)

    }

    disable() {
        this.deviceSettings = undefined
        this.gnomeSettings = undefined

        if (this.mixerSubscription) {
            this.mixer?.unsubscribe(this.mixerSubscription)
            this.mixerSubscription = undefined
        }
        this.mixer?.dispose()
        this.mixer = undefined

        this.indicator?.destroy()
        this.indicator = undefined
    }

}