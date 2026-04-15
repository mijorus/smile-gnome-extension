# Smile - complementary extension for GNOME

## Download Smile

https://github.com/mijorus/smile

## Configure <kbd>Super</kbd>+<kbd>.</kbd> to launch smile

To launch the picker on <kbd>Super</kbd>+<kbd>.</kbd>, you need to ensure that smile it self installed and configure a keyboard shortcut:

1. Go to Settings
2. Select "Keyboard"
3. Select "View and Customize Shortcuts"
4. Scroll down to "Custom Shortcuts" and click it
5. Click on the plus sign
6. Choose smile as name
7. Input `flatpak run it.mijorus.smile as command (or another command launching smile in your environment)
8. Click on "Set Shortcut..."
9. Press <kbd>Super</kbd>+<kbd>.</kbd>.
10. Click on "Add".
11. Close all dialogs
12. <kbd>Super</kbd>+<kbd>.</kbd> should work now.

## Publish a new release

```
zip -xrelease.zip -xREADME.md release.zip * 
```

## ES5 release (GNOME 44 and older)

Please refer to the branch called `44` 

## Credits

Thanks to [pesader](https://github.com/pesader)
