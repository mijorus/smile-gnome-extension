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

import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import St from 'gi://St';
import Clutter from 'gi://Clutter';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

export default class SmileExtension extends Extension {
    constructor(metadata) {
        // console.log('extension initialized');
        super(metadata);
        this.virtualKeyboard = null;
        this.clipboard = null;
        this.dbusSignalId = null;
        this.timeouts = [];
        this.listenerId = 0;
    }

    getVirtualKeyboard() {
        if (this.virtualKeyboard) {
            return this.virtualKeyboard;
        }

        let deviceType = Clutter.InputDeviceType.KEYBOARD_DEVICE;
        this.virtualKeyboard = Clutter.get_default_backend().get_default_seat().create_virtual_device(deviceType);

        return this.virtualKeyboard;
    }

    disableTimeouts() {
        for (let t of this.timeouts) {
            GLib.Source.remove(t);
        }

        this.timeouts = [];
    }

    pasteEmoji(copiedText) {
        this.clipboard.get_text(St.ClipboardType.PRIMARY, (__, text) => {
            if (text !== copiedText) {
                this.clipboard.set_text(St.ClipboardType.PRIMARY, copiedText);
            }

            const t1 = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 250, () => {
                this.getVirtualKeyboard().notify_keyval(Clutter.get_current_event_time(), Clutter.KEY_Control_L, Clutter.KeyState.RELEASED);
                this.getVirtualKeyboard().notify_keyval(Clutter.get_current_event_time(), Clutter.KEY_Control_L, Clutter.KeyState.PRESSED);
                this.getVirtualKeyboard().notify_keyval(Clutter.get_current_event_time(), Clutter.KEY_v, Clutter.KeyState.PRESSED);
            });

            const t2 = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 300, () => {
                this.getVirtualKeyboard().notify_keyval(Clutter.get_current_event_time(), Clutter.KEY_Control_L, Clutter.KeyState.RELEASED);
                this.getVirtualKeyboard().notify_keyval(Clutter.get_current_event_time(), Clutter.KEY_v, Clutter.KeyState.RELEASED);
            });

            this.timeouts.push(t1, t2);
        });
    }

    onNewWindowCreated(window) {
        if (window.get_gtk_application_id() === 'it.mijorus.smile'
            && window.get_title() === 'Smile') {
            window.raise_and_make_recent();
            window.make_above();
        }
    }

    enable() {
        this.clipboard = St.Clipboard.get_default();
        this.disableTimeouts();

        this.listenerId = global.display.connect('window-created', (_, window) => {
            window.get_compositor_private().connect('realize', () => {
                this.onNewWindowCreated(window)
            });
        })


        this.dbusSignalId = Gio.DBus.session.signal_subscribe(
            null,
            'it.mijorus.smile',
            'CopiedEmoji',
            '/it/mijorus/smile/actions',
            null,
            Gio.DBusSignalFlags.NONE,
            (connection, sender_name, object_path, interface_name, signal_name, params) => {
                this.pasteEmoji(params.get_child_value(0).get_string()[0]);
            },
        );
    }

    disable() {
        this.disableTimeouts();
        global.display.disconnect(this.listenerId);

        // unsub
        if (this.dbusSignalId !== undefined) {
            Gio.DBus.session.signal_unsubscribe(this.dbusSignalId);
        }

        this.virtualKeyboard = null;
        this.clipboard = null;
        this.dbusSignalId = null;
    }
}
