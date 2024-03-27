const TelegramBot = require("node-telegram-bot-api");
const { version, bitfinex, coinex, bybit } = require("ccxt");
const moment = require('moment');
const { MongoClient, ObjectId } = require('mongodb');

const CONNECTION_URL = '{MONGODB_CONNECTION_STRING}';
const DATABASE_NAME = 'test';

let token = "{TELEGRAM_TOKEN}"
let adminID = 0; // YOUR CHAT id INCASE YOU NEED TO SEE LOGS
let chatID = adminID;
let Bitfinex_apiKey = "{APIKEY}";
let Bitfinex_apiSecret = "{APISECRET}";

let Coinex_apiKey = "{APIKEY}";
let Coinex_apiSecret = "{APISECRET}";

let Bybit_apiKey = "{APIKEY}";
let Bybit_apiSecret = "{APISECRET}";


(async () => {
    var users, coins;
    await MongoClient.connect(CONNECTION_URL).then((client) => {
        let connection = client.db(DATABASE_NAME)
        users = connection.collection("users")
        coins = connection.collection("coins")
        console.log("Database Connected")
    })
    const findUser = async (id) => {
        return new Promise((resolve) => {
            const res = users.findOne({ chatId: id });
            if (res !== null) {
                resolve(res);
            }
        })
    }



    const bot = new TelegramBot(token, { polling: true });
    bot.on("polling_error", console.log);

    const Bitfinex = new bitfinex({
        apiKey: Bitfinex_apiKey,
        secret: Bitfinex_apiSecret,
    });
    const Coinex = new coinex({
        apiKey: Coinex_apiKey,
        secret: Coinex_apiSecret,
    });
    const Bybit = new bybit({
        apiKey: Bybit_apiKey,
        secret: Bybit_apiSecret,
    });

    async function login(chatID) {
        const a = await Bitfinex.fetchBalance();
        const b = await Coinex.fetchBalance();
        const c = await Bybit.fetchBalance();

        bot.sendMessage(chatID, "BitFinex: " + JSON.stringify(a.total) + "\n\n" + "CoinEx: " + JSON.stringify(b.total) + "\n\n" + "ByBit: " + JSON.stringify(c.total))
        bot.sendMessage(chatID, "Logged in successfully")
    }

    //login()
    // Set up command handlers

    bot.onText(/\/initialcap (\d+(\.\d+)?)/, async (msg, match) => {
        let initialcap = parseFloat(match[1]);
        await users.updateOne({ chatId: msg.chat.id }, { "$set": { initialcap: initialcap } })
        if (initialcap > 0) {
            bot.sendMessage(msg.chat.id, `Initial Cap is set to : $${initialcap}`);
        } else {
            bot.sendMessage(msg.chat.id, `Initial Cap is invalid: has to be greater than 0`);
        }

    });
    bot.onText(/\/getwatchlist/, async (msg, match) => {
        let message = `All Symbols on watchlist\n`;
        const res = await coins.find({ chatId: msg.chat.id }).toArray()
        res.map((item, index) => {
            message += `[${index + 1}] ${item.symbol} Target-Price: ${item.buying_price} Launch-Date:${item.launch_date} Exchange: ${item.exchange}\n\n`;
        })
        bot.sendMessage(msg.chat.id, message);

    });
    bot.onText(/\/checkgains/, async (msg) => {
        let message = `All Symbols trading\n\n`;
        const res = await coins.find({ chatId: msg.chat.id, trading: true }).toArray()
        for (const item of res) {
            const ticker = await (item.exchange === "bitfinex"
                ? Bitfinex.fetchTicker(item.symbol)
                : item.exchange === "bybit"
                    ? Bybit.fetchTicker(item.symbol)
                    : Coinex.fetchTicker(item.symbol));

            const percent = (ticker.bid - item.bought_price) / item.bought_price * 100;
            message += `${item.symbol} => ${percent.toFixed(3)}% \n\n`
        }
        bot.sendMessage(msg.chat.id, message);

    });
    bot.onText(/\/gain (\d+)/, async (msg, match) => {
        let gain = parseInt(match[1]);

        if (gain > 0) {
            await users.updateOne({ chatId: msg.chat.id }, { "$set": { gains: gain } })
            bot.sendMessage(msg.chat.id, `Gains set to : ${gain}%`);
        } else {
            bot.sendMessage(msg.chat.id, `Gains set is invalid: has to be greater than 0%`);
        }

    });
    bot.onText(/\/delete (\w+\/\w+)/, async (msg, match) => {
        const res = await coins.deleteOne({ chatId: msg.chat.id, symbol: match[1] });
        console.log(res)
        if (res.deletedCount > 0) {
            bot.sendMessage(msg.chat.id, `Symbol: ${match[1]} has been deleted`);
        } else {
            bot.sendMessage(msg.chat.id, `Symbol: ${match[1]} not found`);
        }

    });

    bot.onText(/^\/delete$/, async (msg) => {
        bot.sendMessage(msg.chat.id, `Invalid command /delete {symbol}`);
    });

    bot.onText(/\/addsymbol (\w+\/\w+) (\d+(\.\d+)?) (.+) (\b(coinex|bitfinex|bybit)\b)/, async (msg, match) => {
        try {
            const symbol = match[1];
            const buying_price = match[2];
            const launch_date = match[4];
            const exchange = match[5]

            const item = {
                symbol: symbol.toUpperCase(),
                buying_price: parseFloat(buying_price),
                launch_date: moment(launch_date).format("YYYY-MM-DD HH:mm") + " UTC (Coordinated Universal Time)",
                exchange: exchange,
                trading: false,
                chatId: msg.chat.id
            };
            await coins.updateOne({ chatId: msg.chat.id }, { "$set": item }, { upsert: true })
            bot.sendMessage(msg.chat.id, "Symbol Added : \n" + JSON.stringify(item).replace(",", ",\n"));

        } catch (err) {
            console.log(err);
        }
    });
    bot.onText(/\/start/, (msg) => {
        bot.sendMessage(msg.chat.id, `Welcome ot mrleeTradingBot, we trading only launching coins on Bybit, CoinEx and Bitfinex`);
    });

    bot.onText(/\/stop/, (msg) => {
        if (msg.chat.id === adminID) {
            //process.exit(0);
        } else {
            bot.sendMessage(msg.chat.id, `You are not admin hence such actions are forbidden`);
        }

    });

    bot.onText(/\/help/, (msg) => {
        const helpText = `Help Message\n\n
        /initialcap {amount}\n
        /addsymbol {symbol} {buying_price}  {launch_date} {coinex|bitfinex|bybit}\n
        /gains {percent}\n
        /getwatchlist - shows watchlist
        /delete {symbol}\n
        /help`;
        bot.sendMessage(msg.chat.id, helpText);
    });
    bot.onText(/^\/initialcap$/, (msg) => {
        bot.sendMessage(msg.chat.id, `Initial Cap is invalid\n /initialcap <amount>`);
    });
    bot.onText(/^\/addsymbol$/, (msg) => {
        bot.sendMessage(msg.chat.id, `Invalid command /addsymbol <symbol> <buying_price>  "<launch_date>" <coinex|bitfinex|bybit>`);
    });

    bot.on('message', async (msg) => {
        try {
            console.log(msg);
            chatID = msg.chat.id;
            await findUser(msg.chat.id).then(async (res) => {
                chatID = msg.chat.id;
                if (res === null) {
                    await users.insertOne({
                        chatId: msg.chat.id,
                        gains: 1000,
                        initialcap: 10,
                    })
                    bot.sendMessage(msg.chat.id, `New User Detected!!!\nCreated settings:\n\nIntialCap: $10\nGains: 1000%`);
                }
            })
        } catch (err) {
            console.log(err)
        }

    });

    (async () => {

        setInterval(async () => {
            try {
                let initialcap, gain;
                const userData = await users.findOne({ chatId: chatID });
                if (userData !== null) {
                    initialcap = userData.initialcap;
                    gain = userData.gains;
                }
                const res = await coins.find({}).toArray()
                for (const coin of res) {
                    if (coin.exchange === "bitfinex") {
                        await Bitfinex.loadMarkets();
                    } else if (coin.exchange === "coinex") {
                        await Coinex.loadMarkets();
                    } else {
                        await Bybit.loadMarkets();
                    }

                    if (moment(new Date(coin.launch_date)).valueOf() <= moment(new Date().toISOString()).valueOf()) {
                        !coin.trading ?
                            bot.sendMessage(chatID, "Launch date/time has passed for " + coin.symbol + " date: " + coin.launch_date)
                            : null;
                        const symbols = (coin.exchange === "bitfinex" ?
                            Object.values(Bitfinex.symbols)
                            : coin.exchange === "bybit"
                                ? Object.values(Bybit.symbols)
                                : Object.values(Coinex.symbols));
                        if (symbols.includes(coin.symbol)) {
                            const ticker = await (coin.exchange === "bitfinex"
                                ? Bitfinex.fetchTicker(coin.symbol)
                                : coin.exchange === "bybit"
                                    ? Bybit.fetchTicker(coin.symbol)
                                    : Coinex.fetchTicker(coin.symbol));

                            if (ticker.ask <= coin.buying_price && coin.trading === false) {
                                bot.sendMessage(chatID, "Symbol: " + coin.symbol + " Buying Price: " + ticker.ask + " \n\n*Capital greater than price*")
                                const balance = await (coin.exchange === "bitfinex"
                                    ? Bitfinex.fetchBalance()
                                    : coin.exchange === "bybit"
                                        ? Bybit.fetchBalance()
                                        : Coinex.fetchBalance());
                                let pair = coin.symbol.replace("/TESTUSD", "").replace("/USDT", "");
                                const coinBalance = (coin.exchange === "bitfinex"
                                    ? balance.total[pair] === undefined ? 0 : balance.total[pair] :
                                    balance.total[pair] === undefined ? 0 : balance.total[pair]
                                )
                                // balance['total'][coin.symbol.replace("/USDT", "")] > 0 ? balance['total'][coin.symbol.replace("/USDT", "")] : 0;

                                let amount = initialcap / ticker.bid;
                                if (coinBalance < amount) {
                                    if (balance.total?.TESTUSD >= 0) {
                                        const order = await (coin.exchange === "bitfinex"
                                            ? Bitfinex.createOrder(coin.symbol, "market", "buy", amount, 1)
                                            : coin.exchange === "bybit"
                                                ? Bybit.createOrder(coin.symbol, "market", "buy", amount, 1)
                                                : Coinex.createOrder(coin.symbol, "market", "buy", amount, 1));

                                        bot.sendMessage(chatID, "Buying Symbol: " + coin.symbol)
                                        if (order.status !== 'canceled') {
                                            await coins.updateOne({ _id: new ObjectId(coin._id) }, { "$set": { trading: true, bought_price: order.price } })
                                            bot.sendMessage(chatID, "Order has been succcessfully created")
                                        } else {
                                            bot.sendMessage(chatID, "Order failed to create")
                                            bot.sendMessage(chatID, JSON.stringify(order))
                                        }
                                    }
                                } else {
                                    bot.sendMessage(chatID, "We have a problem")
                                }
                            } else if (coin.trading === true) {
                                const percent = (ticker.bid - coin.bought_price) / coin.bought_price * 100;
                                bot.sendMessage(chatID, `Percentage Movement : ${percent.toFixed(3)}% Symbol: ${coin.symbol}`);
                                const balance = await (coin.exchange === "bitfinex"
                                    ? Bitfinex.fetchBalance()
                                    : coin.exchange === "bybit"
                                        ? Bybit.fetchBalance()
                                        : Coinex.fetchBalance());
                                let pair = coin.symbol.replace("/TESTUSD", "").replace("/USDT", "");
                                const coinBalance = (coin.exchange === "bitfinex"
                                    ? balance.total[pair] === undefined ? 0 : balance.total[pair] :
                                    balance.total[pair] === undefined ? 0 : balance.total[pair]
                                )
                                if (coinBalance > 0 && percent >= gain) {
                                    const order = await (coin.exchange === "bitfinex"
                                        ? Bitfinex.createOrder(coin.symbol, "market", "sell", coinBalance, 1)
                                        : coin.exchange === "bybit"
                                            ? Bybit.createOrder(coin.symbol, "market", "sell", coinBalance, 1)
                                            : Coinex.createOrder(coin.symbol, "market", "sell", coinBalance, 1));
                                    bot.sendMessage(chatID, "Exiting Symbol: " + coin.symbol)
                                    if (order.status !== 'canceled') {
                                        await coins.deleteOne({ _id: new ObjectId(coin._id) })
                                        bot.sendMessage(chatID, `Order: ${coin.symbol} has been succcessfully closed`)
                                    } else {
                                        bot.sendMessage(chatID, "Order failed to close")
                                        bot.sendMessage(chatID, JSON.stringify(order))
                                    }

                                }
                            }
                        } else {
                            bot.sendMessage(chatID, "Symbol is not found")
                        }

                    }
                }

            } catch (err) {
                bot.sendMessage(chatID, err.toString())
            }

        }, 60 * 1000);
    })()
})()


