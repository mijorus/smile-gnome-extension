/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */
// import { DBus, DBusExportedObject, DBusSignalFlags, Settings } from '@gi-types/gio2';
// import { PRIORITY_DEFAULT, Source, SOURCE_REMOVE, timeout_add } from '@gi-types/glib2';
// import { Global } from '@gi-types/shell0';
// import { SettingsMenu } from '@pano/components/indicator/settingsMenu';
// import { PanoWindow } from '@pano/containers/panoWindow';
// import { ClipboardContent, clipboardManager, ContentType } from '@pano/utils/clipboardManager';
// import { db } from '@pano/utils/db';
// import { KeyManager } from '@pano/utils/keyManager';
// const utils = Me.imports.utils;


class Extension {
    constructor() {
        console.log('extension initialized');

        const iface = this.loadInterface();
        this.dbus = imports.gi.Gio.DBusExportedObject.wrapJSObject(iface, this);
        this.dbus.export(DBus.session, '/it/mijorus/smile');

        this.virtualKeyboard = undefined;
        this.timeoutId = undefined;
    }

    getVirtualKeyboard() {
        if (this.virtualKeyboard) {
            return this.virtualKeyboard;
        }

        deviceType = imports.gi.Clutter.InputDeviceType.KEYBOARD_DEVICE;
        this.virtualKeyboard = imports.Clutter.get_default_backend().get_default_seat().create_virtual_device(deviceType);

        return this.virtualKeyboard;
    }

    pasteEmoji(text) {
        let clipboard = imports.gi.Gdk.Clipboard();

        if (clipboard.get_content().get_value() !== text) {
            let contextProvider = imports.gi.Gdk.ContentProvider.new_for_value(text);
            clipboard.set_value(contextProvider);
        }

        this.timeoutId = imports.gi.GLib.timeout_add(PRIORITY_DEFAULT, 250, () => {
            this.getVirtualKeyboard().notify_keyval(get_current_event_time(), KEY_Control_L, KeyState.RELEASED);
            this.getVirtualKeyboard().notify_keyval(get_current_event_time(), KEY_Control_L, KeyState.PRESSED);
            this.getVirtualKeyboard().notify_keyval(get_current_event_time(), KEY_v, KeyState.PRESSED);
            this.getVirtualKeyboard().notify_keyval(get_current_event_time(), KEY_Control_L, KeyState.RELEASED);
            this.getVirtualKeyboard().notify_keyval(get_current_event_time(), KEY_v, KeyState.RELEASED);
            if (this.timeoutId) {
                imports.gi.GLib.Source.remove(this.timeoutId);
            }

            this.timeoutId = undefined;
        });
    }

    loadInterface() {
        const uri = `file:///${imports.misc.extensionUtils.getCurrentExtension().path}/dbus-interface.xml`;
        const file = imports.gi.Gio.File.new_for_uri(uri);

        try {
            const [, bytes] = file.load_contents(null);
            return imports.byteArray.toString(bytes);
        } catch (e) {
            console.log(`Failed to load D-Bus interface`);
        }

        return null;
    }

    enable() {
    }

    disable() {
    }
}

function init() {
    return new Extension();
}
