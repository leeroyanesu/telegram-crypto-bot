# Trading Bot with CCXT and Telegram Integration

This trading bot utilizes the CCXT library to trade on various cryptocurrency exchanges. It relies on Telegram to receive information to trade, such as new coins launching on different exchanges. The bot checks for the presence of specified symbols every 60 seconds. If the coin is found and its price meets the specified criteria, the bot enters a buy position. Once in a buy state, if the gain reaches the target percentage, the bot closes the trade by exchanging the bought coins back to USDT.

## Files 

- `index.js`: This is the main JavaScript file where the trading bot logic is implemented.

## Usage

1. **Setup CCXT**: Ensure you have CCXT installed. You can install it via npm:

2. **Setup Telegram**: You'll need to set up a Telegram bot and obtain a token. This token will be used to interact with the Telegram API for receiving trading information.

3. **Configure Exchanges**: Specify the exchanges you want the bot to trade on. The bot can support any exchange supported by CCXT.

4. **Set Trading Parameters**: Define the symbols you want to monitor and the criteria for entering and exiting trades, such as price thresholds and target gain percentage.

5. **Run the Bot**: Execute the `index.js` file to start the bot. It will continuously monitor the specified symbols and execute trades accordingly.

## Note

- This trading bot can work with any exchange supported by CCXT. Ensure that your desired exchanges are included in the list of supported exchanges.

## License

MIT License

Copyright (c) 2024 Leeroy Chako

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
