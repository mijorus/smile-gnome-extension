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
"use strict"

import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

const AttentionHandler = Main.windowAttentionHandler;
const DefaultDemandsAttention = AttentionHandler._onWindowDemandsAttention;

export default class SmileExtension extends Extension {
    constructor(metadata) {
        // console.log('extension initialized');
        super(metadata);
        this.virtualKeyboard = null;
        this.clipboard = null;
        this.dbusSignalId = null;
        this.timeouts = [];

        this.connectHandlers(this.skipNotification)
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

    skipNotification(display, window) {
        if (window && !window.has_focus() && !window.is_skip_taskbar()) {
            Main.activateWindow(window);
        }
    }

    connectHandlers(func) {
        if (AttentionHandler.hasOwnProperty('_windowDemandsAttentionId')
            && AttentionHandler._windowDemandsAttentionId
            && AttentionHandler.hasOwnProperty('_windowMarkedUrgentId')
            && AttentionHandler._windowMarkedUrgentId
        ) {
            global.display.disconnect(AttentionHandler._windowDemandsAttentionId);
            global.display.disconnect(AttentionHandler._windowMarkedUrgentId);

            AttentionHandler._windowDemandsAttentionId = global.display.connect(
                'window-demands-attention',
                (display, window) => {
                    console.log(JSON.stringify(window))
                    func(display, window);
                }
            );

            AttentionHandler._windowMarkedUrgentId = global.display.connect(
                'window-marked-urgent',
                (display, window) => {
                    console.log(JSON.stringify(window))
                    func(display, window);
                }
            );
        }
    }

    enable() {
        this.clipboard = St.Clipboard.get_default();
        this.disableTimeouts();

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
        this.connectHandlers(DefaultDemandsAttention);

        // unsub
        if (this.dbusSignalId !== undefined) {
            Gio.DBus.session.signal_unsubscribe(this.dbusSignalId);
        }

        this.virtualKeyboard = null;
        this.clipboard = null;
        this.dbusSignalId = null;
    }
}
