let serviceInstance = null;
let exportedObject = null;

const { GLib, Gio } = imports.gi;

const interfaceXml = `
<node>
  <interface name="it.mijorus.smile">
    <method name="SimpleMethod"/>
    <method name="ComplexMethod">
      <arg type="s" direction="in" name="input"/>
      <arg type="u" direction="out" name="length"/>
    </method>
    <signal name="CopiedEmoji">
      <arg name="type" type="s"/>
    </signal>
  </interface>
</node>`;

class Service {
    constructor() {
    }

    // Methods
    SimpleMethod() {
        log('SimpleMethod() invoked');
    }

    ComplexMethod(input) {
        log(`ComplexMethod() invoked with '${input}'`);

        return input.length;
    }

    emitTestSignal() {
        this._impl.emit_signal('CopiedEmoji', new GLib.Variant('(s)', ['TEST!']));
        console.log('send')
    }
}


function onBusAcquired(connection, name) {
    // Create the class instance, then the D-Bus object
    serviceInstance = new Service();
    exportedObject = Gio.DBusExportedObject.wrapJSObject(interfaceXml,
        serviceInstance);

    // Assign the exported object to the property the class expects, then export
    serviceInstance._impl = exportedObject;
    exportedObject.export(connection, '/it/mijorus/smile');


    serviceInstance.emitTestSignal()
}

function onNameAcquired(connection, name) {
    // Clients will typically start connecting and using your interface now.
}

function onNameLost(connection, name) {
    // Well behaved clients will know not to call methods on your interface now
}

//const loop = GLib.MainLoop.new(null, false);


const ownerId = Gio.bus_own_name(
    Gio.BusType.SESSION,
    'it.mijorus.smile',
    Gio.BusNameOwnerFlags.NONE,
    onBusAcquired,
    onNameAcquired,
    onNameLost
);

console.log(ownerId)
