/**
 * The code in this file is heavily based on Marcin Jahn's Gnome extension to hide audio devices from panel.
 *
 * The original code can be found at https://github.com/marcinjahn/gnome-quicksettings-audio-devices-hider-extension/tree/main
 * Original code is licensed under the MIT license (https://github.com/marcinjahn/gnome-quicksettings-audio-devices-hider-extension/blob/main/LICENSE)
 */

import Gvc from 'gi://Gvc'
import Gio from 'gi://Gio'
import * as Volume from 'resource:///org/gnome/shell/ui/status/volume.js'
import * as Main from 'resource:///org/gnome/shell/ui/main.js'

import {DeviceType, StoredDevice} from "./deviceSettings.js";
import {delay, range} from "./utils.js";

export enum Action {
    ADDED = "ADDED",
    REMOVED = "REMOVED"
}

export interface MixerEvent {
    type: DeviceType,
    action: Action,
    deviceId: number
}

export interface MixerSubscription {
    ids: number[];
}

/**
 * Represents the id of a device from MixerControl
 */
export type MixerDevice = {
    id: number,
    name: string
}

export class MixerSource {
    async getMixer(): Promise<Mixer> {
        const mixer = Volume.getMixerControl();

        await waitForMixerToBeReady(mixer);
        await delay(200);

        return new Mixer(mixer, () => {});
    }
}

async function waitForMixerToBeReady(
    mixer: Gvc.MixerControl
): Promise<void> {
    while (mixer.get_state() === Gvc.MixerControlState.CONNECTING) {
        await delay(200);
    }

    const state = mixer.get_state();

    if (state === Gvc.MixerControlState.FAILED) {
        throw new Error("MixerControl is in a failed state");
    } else if (state === Gvc.MixerControlState.CLOSED) {
        throw new Error("MixerControl is in a closed state");
    }
}

export class Mixer {
    constructor(private control: Gvc.MixerControl, private disposal: () => void) {}

    getAllDevices(type: DeviceType): MixerDevice[] {
        const quickSettings = Main.panel.statusArea.quickSettings
        const devices = type === DeviceType.OUTPUT
            ? quickSettings._volumeOutput._output._deviceItems
            : quickSettings._volumeInput._input._deviceItems
        const ids: number[] = Array.from(devices, ([id]) => id)
        return this.getAudioDevicesFromIds(ids, type)
    }

    /**
     * Makes a best-effort to get the name of a device from the Quick Settings Audio Panel.
     *
     * This method is useful in case the user has an extension like
     * https://github.com/marcinjahn/gnome-quicksettings-audio-devices-renamer-extension/tree/main
     * which renames audio devices.
     *
     * As other extensions also interfere with how the audio panel works, it is not guaranteed
     * that any name will be found (for instance, if an extension to hide devices has been used).
     *
     * @param device stored device in extension's settings
     *
     * @returns device name, if found, or undefined when this did not work
     */
    getAudioPanelDeviceName(device: StoredDevice): string | undefined {
        try {
            const quickSettings = Main.panel.statusArea.quickSettings
            const quickSettingsDevices = device.type === DeviceType.OUTPUT
                ? quickSettings._volumeOutput._output._deviceItems
                : quickSettings._volumeInput._input._deviceItems

            return quickSettingsDevices.get(device.id)?.label.get_text()

        } catch (error) {
            // another extension may have messed with the audio panel
            return undefined
        }
    }

    getGIcon(device: StoredDevice): Gio.Icon {
        const iconName = this.control.lookup_output_id(device.id).get_icon_name();
        return Gio.ThemedIcon.new_with_default_fallbacks(iconName + "-symbolic");
    }

    getVolume(device: StoredDevice): number | undefined {
        const uidevice = this.control.lookup_output_id(device.id);
        const stream = this.control.get_stream_from_device(uidevice);
        return stream.get_volume() / this.control.get_vol_max_norm();
    }

    /**
     * Generate a name similar to https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/status/volume.js#L132
     *
     * @param device Gvc lookup value
     * @private
     */
    private constructDeviceName(device: Gvc.MixerUIDevice) {
        return device.origin ? `${device.description} - ${device.origin}` : device.description
    }

    getAudioDevicesFromIds(ids: number[], type: DeviceType): MixerDevice[] {
        return this.getUIDevicesFromIds(ids, type).map(device => {
            return { id: device.get_id(), name: this.constructDeviceName(device) }
        })
    }

    private getUIDevicesFromIds(ids: number[], type: DeviceType): Gvc.MixerUIDevice[] {
        return ids.map((id) => {
            const lookup = type === DeviceType.OUTPUT
                ? this.control.lookup_output_id(id)
                : this.control.lookup_input_id(id);

            return lookup
        });

    }

    getDefaultOutput(): string {
        const stream = this.control.get_default_sink()
        return this.constructDeviceName(this.control.lookup_device_from_stream(stream))
    }

    getDefaultInput(): string {
        const stream = this.control.get_default_source()
        return this.constructDeviceName(this.control.lookup_device_from_stream(stream))
    }

    /**
     * Set output device. First, try by id. If id not found, try finding it with name.
     *
     * @param id device id
     * @param name display name
     * @returns true if device changed, false if no device found with this name
     */
    setOutput(id: number, name: string): boolean {
        let device = this.control.lookup_output_id(id);
        if (!device) {
            const deviceByName = this.getDeviceFromName(name, DeviceType.OUTPUT)
            if (deviceByName) {
                device = deviceByName
            }
        }

        if (device) {
            this.control.change_output(device)
            return true
        } else {
            return false
        }
    }

    /**
     * Set input device. First, try by id. If id not found, try finding it with name.
     *
     * @param id device id
     * @param name display name
     * @returns true if device changed, false if no device found with this name
     */
    setInput(id: number, name: string): boolean {
        let device = this.control.lookup_input_id(id);
        if (!device) {
            const deviceByName = this.getDeviceFromName(name, DeviceType.INPUT)
            if (deviceByName) {
                device = deviceByName
            }
        }

        if (device) {
            this.control.change_input(device)
            return true
        } else {
            return false
        }
    }

    /**
     * Uses a Dummy Device "trick" from
     * https://github.com/kgshank/gse-sound-output-device-chooser/blob/master/sound-output-device-chooser@kgshank.net/base.js#LL299C20-L299C20
     * @param name display name
     * @param type device type
     * @returns mixer stream
     */
    private getDeviceFromName(name: string, type: DeviceType): Gvc.MixerUIDevice | undefined {
        const dummyDevice = new Gvc.MixerUIDevice();
        const devices = this.getUIDevicesFromIds(range(dummyDevice.get_id()), type)
        console.info(devices)

        return devices.find(d => d !== null && this.constructDeviceName(d) === name)
    }

    subscribeToDeviceChanges(
        callback: (event: MixerEvent) => void
    ): MixerSubscription {
        const addOutputId = this.control.connect("output-added", (_, deviceId) =>
            callback({ deviceId, type: DeviceType.OUTPUT, action: Action.ADDED })
        );
        const removeOutputId = this.control.connect("output-removed", (_, deviceId) =>
            callback({ deviceId, type: DeviceType.OUTPUT, action: Action.REMOVED })
        );
        const addInputId = this.control.connect("input-added", (_, deviceId) =>
            callback({ deviceId, type: DeviceType.INPUT, action: Action.ADDED })
        );
        const removeInputId = this.control.connect("input-removed", (_, deviceId) =>
            callback({ deviceId, type: DeviceType.INPUT, action: Action.REMOVED })
        );

        return { ids: [addOutputId, removeOutputId, addInputId, removeInputId] };
    }

    unsubscribe(subscription: MixerSubscription) {
        subscription.ids.forEach((id) => {
            this.control.disconnect(id);
        });
    }

    dispose() {
        this.disposal();
    }

}