# Analog Project with Nitro WebSocket Support

This repository demonstrates the integration of Nitro's WebSocket support in an Analog project. While the WebSocket functionality works flawlessly in a standalone Nitro setup, it encounters issues when used with the Vite plugin for Nitro within the Analog framework.

## Problem Statement

In this setup, WebSockets close unexpectedly on the server side without informing the client. The `upgrade` routine in Nitro is triggered, and the `open` hook for the route is executed. However, the connection is then immediately closed with code 1006, causing the client to timeout.

## Investigation

Efforts to debug this issue involved:
- Diving into both Analog's and Nitro's codebases.
- Tracing the WebSocket connection lifecycle.
- Comparing the behavior between a standalone Nitro setup and one using the Vite plugin for Nitro.

Despite these efforts, the root cause of the issue remains unidentified (at least for me for now)

## Related Repositories
- [`standalone-nitro-websocket`](https://github.com/nckirik/nitro-websocket): A sample project demonstrating working WebSocket support in a standalone Nitro setup.
- `nitro-with-analog-plugin`: *(this repo)* A sample project demonstrating the WebSocket issue when using the Vite plugin for Nitro within Analog.

## Installation and Running the Project
### Install
```
git clone https://github.com/nckirik/analog-nitro-websocket
cd analog-nitro-websocket
pnpm install
```
### Run
* `pnpm start`
* go to `localhost:5000`
* click to `Connect` button on the top right
* follow browser and terminal messages

## 

## Contributions
If you have any insights or potential fixes for this issue, please feel free to open a pull request or an issue on this repository. Your contributions are highly appreciated. 

## License
This project is licensed under the MIT License.
