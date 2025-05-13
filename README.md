# Audio Switch Shortcuts

## Installation

## Install from published release

You can download the latest release from TODO. Then, copy the folder to `~/.local/share/gnome-shell/extensions`.
You may need to log out before the extension will become available. When logging back in, you can run the following
command to enable the extension:

```shell
/usr/bin/gnome-extensions enable audio-switch-shortcuts@dbatis.github.com
```

### Install from source

Clone this repository in any folder, then:
```shell
cd <repo-folder>
make install
/usr/bin/gnome-extensions enable audio-switch-shortcuts@dbatis.github.com
```

You may need to log out and back in again for the extension to become available.

## Extension removal

If you wish to uninstall this extension, first run the following commands:

```shell
/usr/bin/gnome-extensions disable audio-switch-shortcuts@dbatis.github.com
rm -rf ~/.local/share/gnome-shell/extensions/audio-switch-shortcuts@dbatis.github.com
```

## Credits

- This program contains code derived from [Tiling Shell](https://github.com/domferr/tilingshell/tree/main),
  authored by Domenico Ferraro. Original code under
  [GPL 2.0 license](https://github.com/domferr/tilingshell/tree/main?tab=GPL-2.0-1-ov-file#readme).
- This program contains code derived from [Quick Settings Audio Devices Hider Gnome Extension](https://github.com/marcinjahn/gnome-quicksettings-audio-devices-hider-extension),
  authored by Marcin Jahn. Original code under
  [MIT License](https://github.com/marcinjahn/gnome-quicksettings-audio-devices-hider-extension?tab=MIT-1-ov-file#readme).
- [Gnome Workbench](https://github.com/workbenchdev/Workbench) has been an invaluable resource to learn
  to program with GNOME technologies.