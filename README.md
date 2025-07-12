# TON-locker
Locker tact smart contract 

## How to use

First, let's install all the dependencies:

```shell
yarn install
```

Now we're ready to build our contract:

```shell
yarn build
```

Once you've built our contract, you can deploy it:

```shell
yarn deploy
```

Let's look at some other useful commands.

To test your contract after changes, run:

```shell
yarn test
```

If you want to quickly check your changes for validity, run:

```shell
yarn lint
```

This check will run the Tact source code formatter in the style checking mode and the [misti](https://github.com/nowarp/misti) static analyzer to check for common issues.

If you'd like to format the Tact source code in the [sources](./sources) directory, run:

```shell
yarn fmt
```
