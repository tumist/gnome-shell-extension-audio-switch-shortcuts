/**
 * The code in this file is heavily based on Marcin Jahn's Gnome extension to hide audio devices from panel.
 *
 * The original code can be found at https://github.com/marcinjahn/gnome-quicksettings-audio-devices-hider-extension/tree/main
 * Original code is licensed under the MIT license (https://github.com/marcinjahn/gnome-quicksettings-audio-devices-hider-extension/blob/main/LICENSE)
 */

import Gvc from 'gi://Gvc'
import * as Volume from 'resource:///org/gnome/shell/ui/status/volume.js'
import * as Main from 'resource:///org/gnome/shell/ui/main.js'

import {DeviceType} from "./deviceSettings.js";
import {delay} from "./utils.js";

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

    getAllDevices(type: DeviceType): string[] {
        const quickSettings = Main.panel.statusArea.quickSettings
        const devices = type === DeviceType.OUTPUT
            ? quickSettings._volumeOutput._output._deviceItems
            : quickSettings._volumeInput._input._deviceItems
        const ids: number[] = Array.from(devices, ([id]) => id)
        return this.getAudioDevicesFromIds(ids, type)
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

    getAudioDevicesFromIds(ids: number[], type: DeviceType): string[] {
        return ids.map((id) => {
            const lookup = type === DeviceType.OUTPUT
                ? this.control.lookup_output_id(id)
                : this.control.lookup_input_id(id);

            return this.constructDeviceName(lookup)
        });
    }

    /**
     * Uses a Dummy Device "trick" from
     * https://github.com/kgshank/gse-sound-output-device-chooser/blob/master/sound-output-device-chooser@kgshank.net/base.js#LL299C20-L299C20
     * @param displayNames display names
     * @param type
     * @returns A list of matching audio devices. If a given display name is not found,
     * undefined is returned in its place.
     */
    // getAudioDevicesFromDisplayNames(displayNames: string[], type: DeviceType): (AudioDevice | undefined)[] {
    //     const dummyDevice = new Gvc.MixerUIDevice();
    //
    //     const devices = this.getAudioDevicesFromIds(
    //         range(dummyDevice.get_id()),
    //         type
    //     );
    //
    //     return displayNames.map((name) =>
    //         devices.find((device) => device.name === name)
    //     );
    // }

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