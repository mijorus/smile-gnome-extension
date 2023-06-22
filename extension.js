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
import { DBus, DBusExportedObject, DBusSignalFlags, Settings } from '@gi-types/gio2';
import { PRIORITY_DEFAULT, Source, SOURCE_REMOVE, timeout_add } from '@gi-types/glib2';
import { Global } from '@gi-types/shell0';
import { SettingsMenu } from '@pano/components/indicator/settingsMenu';
import { PanoWindow } from '@pano/containers/panoWindow';
import { ClipboardContent, clipboardManager, ContentType } from '@pano/utils/clipboardManager';
import { db } from '@pano/utils/db';
import { KeyManager } from '@pano/utils/keyManager';

class Extension {
    constructor() {
        debug('extension is initialized');
        this.keyManager = new KeyManager();
        const iface = loadInterfaceXML('it.mijorus.smile');
        this.dbus = DBusExportedObject.wrapJSObject(iface, this);
        this.dbus.export(DBus.session, '/it/mijorus/smile');
    }

    enable() {
    }

    disable() {
    }
}

function init() {
    return new Extension();
}
