export function getCurrentExtension() {
    return imports.misc.extensionUtils.getCurrentExtension();
}

export function loadInterfaceXML(iface){
  const uri = `file:///${getCurrentExtension().path}/dbus/${iface}.xml`;
  const file = imports.gi.Gio.File.new_for_uri(uri);

  try {
    const [, bytes] = file.load_contents(null);
    return imports.byteArray.toString(bytes);
  } catch (e) {
    debug(`Failed to load D-Bus interface ${iface}`);
  }

  return null;
};