import Gio from 'gi://Gio'

import * as Constants from './constants.js'

export enum DeviceType {
    INPUT = "INPUT",
    OUTPUT = "OUTPUT",
}

/**
 * Represents an audio device and its cycling status.
 */
export type AudioDevice = {
    name: string,
    deviceType: DeviceType,
    cycled: boolean,
    active: boolean
}

/**
 * Utility to handle settings for the audio switcher.
 *
 * This class only handles the complex case of storing available audio inputs and outputs. Simpler
 * settings (such as whether to show the indicator or notifications) are handled separately
 * by extension.ts and prefs.ts.
 */
export class DeviceSettings {
    private settings: Gio.Settings

    constructor(settings: Gio.Settings) {
        this.settings = settings
    }

    getActiveDevices(deviceType: DeviceType) {
        return this.load(deviceType).filter(d => d.deviceType === deviceType && d.active)
    }

    /**
     * Should be used only on startup, to set all devices as disabled, so that the
     * program can then re-set active devices.
     */
    disableAllDevices() {
        const devices = this.loadAll()
        for (const device of devices) {
            device.active = false
        }
        this.store(devices)
    }

    /**
     * Add a new input device with the given name, mark it as cycled: false, active: true.
     * If the device already exists in settings, mark it as active.
     */
     addOrEnableDevice(name: string, deviceType: DeviceType) {
        const devices = this.loadAll()
        const existingDevice = devices.find(d =>
            d.name === name && d.deviceType === deviceType)
        if (!existingDevice) {
            // device not found, append it and store in settings
            devices.push({name: name, deviceType: deviceType, cycled: false, active: true})
        } else {
            // this updates the array value as well
            existingDevice.active = true
        }
        this.store(devices)
    }

    disableDevice(name: string, deviceType: DeviceType) {
        const devices = this.loadAll()
        const existingDevice = devices.find(
            (d) => d.name === name && d.deviceType === deviceType
        )
        if (existingDevice) {
            existingDevice.active = false
        }
        this.store(devices)
    }

    /**
     * Update active and cycled fields of device in settings. Does nothing if the device
     * was not found already in settings.
     */
    setCycled(name: string, deviceType: DeviceType, cycled: boolean) {
        const devices = this.loadAll()
        const existingDevice = devices.find(
            (d) => d.name === name && d.deviceType === deviceType
        )
        if (existingDevice) {
           existingDevice.cycled = cycled
           this.store(devices)
        }
    }

    /**
     * Remove the device from its current position, add it in the new position. Should only be used for active devices.
     *
     * @param device device to alter.
     * @param newPosition zero-based index of new position, relative to devices of same type
     */
    reorderDevice(device: AudioDevice, newPosition: number) {
        if (!device.active) {
            // guard against misuse
            return
        }

        const devices = this.loadAll()
        const newArray: AudioDevice[] = []
        let deviceCount = 0
        let wasPlacedInLoop = false
        for (const storedDevice of devices) {
            if (storedDevice.name === device.name && storedDevice.deviceType === device.deviceType) {
                // do nothing, we essentially remove it from new array
            } else if (storedDevice.deviceType === device.deviceType && storedDevice.active) {
                // active device, increase counter and check if we must place the device there
                deviceCount++
                if (deviceCount > newPosition) {
                    newArray.push(device)
                    wasPlacedInLoop = true
                }
                newArray.push(storedDevice)
            } else {
                newArray.push(storedDevice)
            }
        }

        // if it was not placed in loop, because it will be last item, add it now
        if (!wasPlacedInLoop) {
            newArray.push(device)
        }
        this.store(newArray)
    }

    private load(deviceType: DeviceType): AudioDevice[] {
        return JSON.parse(this.settings.get_string(Constants.KEY_AUDIO_DEVICES))
            .filter((d: AudioDevice) => d.deviceType === deviceType)
    }

    private loadAll(): AudioDevice[] {
        return JSON.parse(this.settings.get_string(Constants.KEY_AUDIO_DEVICES))
    }

    private store(value: AudioDevice[]) {
        this.settings.set_string(Constants.KEY_AUDIO_DEVICES, JSON.stringify(value))
    }
}