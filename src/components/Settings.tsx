import { IpcRendererEvent } from "electron";
import React, { useEffect, useState } from "react";
import { writeConfig } from "../helper";
import Header from "./UI/Header";

const {
  remote: { dialog },
  ipcRenderer,
} = window.require("electron");

interface WineProps {
  name: string;
  bin: string;
}

interface AltSettings {
  wineVersion: WineProps;
  winePrefix: string;
  otherOptions: string;
  defaultInstallPath: string;
}

interface Path {
  filePaths: string[];
}

export default function Settings() {
  const [wineVersion, setWineversion] = useState({
    name: "Wine Default",
    bin: "/usr/bin/wine",
  } as WineProps);
  const [winePrefix, setWinePrefix] = useState("~/.wine");
  const [defaultInstallPath, setDefaultInstallPath] = useState("");
  const [otherOptions, setOtherOptions] = useState("");
  const [altWine, setAltWine] = useState([] as WineProps[]);

  useEffect(() => {
    ipcRenderer.send("requestSettings", 'default');
    ipcRenderer.on(
      "defaultSettings",
      (event: IpcRendererEvent, config: AltSettings) => {
        setDefaultInstallPath(config.defaultInstallPath);
        setWineversion(config.wineVersion);
        setWinePrefix(config.winePrefix);
        setOtherOptions(config.otherOptions);
        ipcRenderer.send("getAlternativeWine");
        ipcRenderer.on(
          "alternativeWine",
          (event: IpcRendererEvent, args: WineProps[]) => setAltWine(args)
        );
      }
    );
  }, []);

  const callTools = (tool: string) =>
    ipcRenderer.send("callTool", {
      tool,
      wine: wineVersion.bin,
      prefix: winePrefix,
    });

  return (
    <>
      <Header renderBackButton={false} />
      <div className="Settings">
        <div className="settingsWrapper">
          <span className="setting">
            <span className="settingText">Default Installation Path</span>
            <span>
              <input
                type="text"
                value={defaultInstallPath}
                className="settingSelect small"
                placeholder={"~/Games/Heroic"}
                onChange={(event) => setDefaultInstallPath(event.target.value)}
              />
              <button
                className="button settings"
                onClick={() =>
                  dialog
                    .showOpenDialog({
                      title: "Choose WinePrefix",
                      buttonLabel: "Choose",
                      properties: ["openDirectory"],
                    })
                    .then(({ filePaths }: Path) =>
                      setDefaultInstallPath(
                        filePaths[0] ? `'${filePaths[0]}'` : ""
                      )
                    )
                }
              >
                Choose Folder
              </button>
            </span>
          </span>
          <span className="setting">
            <span className="settingText">Default Wine Version</span>
            <select
              onChange={(event) =>
                setWineversion(
                  altWine.filter(({ name }) => name === event.target.value)[0]
                )
              }
              value={wineVersion.name}
              className="settingSelect"
            >
              {altWine.map(({ name }) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </span>
          <span className="setting">
            <span className="settingText">Default WinePrefix</span>
            <span>
              <input
                type="text"
                value={winePrefix}
                className="settingSelect small"
                onChange={(event) => setWinePrefix(event.target.value)}
              />
              <button
                className="button settings"
                onClick={() =>
                  dialog
                    .showOpenDialog({
                      title: "Choose WinePrefix",
                      buttonLabel: "Choose",
                      properties: ["openDirectory"],
                    })
                    .then(({ filePaths }: Path) =>
                      setWinePrefix(
                        filePaths[0] ? `'${filePaths[0]}'` : "~/.wine"
                      )
                    )
                }
              >
                Choose Folder
              </button>
            </span>
          </span>
          <span className="setting">
            <span className="settingText">
              Other Launch Options (MANGOHUD, PULSE_LATENCY_MSEC, etc.)
            </span>
            <span>
              <input
                id="otherOptions"
                type="text"
                placeholder={"Put here other launch options"}
                className="settingSelect"
                value={otherOptions}
                onChange={(event) => setOtherOptions(event.currentTarget.value)}
              />
            </span>
          </span>
          <div className="settingsTools">
            <div className="buttonsWrapper">
              <button
                className="button settings"
                onClick={() => callTools("winecfg")}
              >
                Winecfg
              </button>
              <button
                className="button settings"
                onClick={() => callTools("winetricks")}
              >
                Winetricks
              </button>
            </div>
          </div>
          <button
            className="button is-success save"
            onClick={() =>
              writeConfig({
                defaultSettings: {
                  defaultInstallPath,
                  wineVersion,
                  winePrefix,
                  otherOptions,
                },
              })
            }
          >
            Save Settings
          </button>
        </div>
      </div>
    </>
  );
}
