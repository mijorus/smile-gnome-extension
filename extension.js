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
 * 
 * Author: Lorenzo Paderi
 */

const { GLib, Gio, St, Clutter, Gdk } = imports.gi;

class Extension {
    constructor() {
        // console.log('extension initialized');
        this.virtualKeyboard = undefined;
        this.clipboard = undefined;
        this.dbusSignalId = undefined;
    }

    getVirtualKeyboard() {
        if (this.virtualKeyboard) {
            return this.virtualKeyboard;
        }

        let deviceType = Clutter.InputDeviceType.KEYBOARD_DEVICE;
        this.virtualKeyboard = Clutter.get_default_backend().get_default_seat().create_virtual_device(deviceType);

        return this.virtualKeyboard;
    }

    pasteEmoji(copiedText) {
        this.clipboard.get_text(St.ClipboardType.PRIMARY, (__, text) => {
            if (text !== copiedText) {
                this.clipboard.set_text(St.ClipboardType.PRIMARY, copiedText);
            }

            const eventTime = Clutter.get_current_event_time() * 1000;
            this.timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 250, () => {
                this.getVirtualKeyboard().notify_keyval(eventTime, Clutter.KEY_Control_L, Clutter.KeyState.RELEASED);
                this.getVirtualKeyboard().notify_keyval(eventTime, Clutter.KEY_Control_L, Clutter.KeyState.PRESSED);
                this.getVirtualKeyboard().notify_keyval(eventTime, Clutter.KEY_v, Clutter.KeyState.PRESSED);
                this.getVirtualKeyboard().notify_keyval(eventTime, Clutter.KEY_Control_L, Clutter.KeyState.RELEASED);
                this.getVirtualKeyboard().notify_keyval(eventTime, Clutter.KEY_v, Clutter.KeyState.RELEASED);
                if (this.timeoutId) {
                    GLib.Source.remove(this.timeoutId);
                }

                this.timeoutId = undefined;
            });
        })
    }

    enable() {
        this.clipboard = St.Clipboard.get_default();

        this.dbusSignalId = Gio.DBus.session.signal_subscribe(
            null,
            'it.mijorus.smile',
            'CopiedEmoji',
            '/it/mijorus/smile/actions',
            null,
            Gio.DBusSignalFlags.NONE,
            (connection, sender_name, object_path, interface_name, signal_name, params) => {
                this.pasteEmoji(params.get_child_value(0).get_string()[0])
            },
        );
    }

    disable() {
        if (this.timeoutId) {
            GLib.Source.remove(this.timeoutId);
        }

        // unsub
        if (this.dbusSignalId !== undefined) {
            Gio.DBus.session.signal_unsubscribe(this.dbusSignalId)
        }
    }
}

function init() {
    return new Extension();
}
