import {task} from 'hardhat/config';
import {ExternalProvider} from '@ethersproject/providers';
import {checkVerification} from '../../helpers/etherscan-verification';
import {ConfigNames} from '../../helpers/configuration';
import {EthereumNetworkNames} from '../../helpers/types';
import {printContracts} from '../../helpers/misc-utils';

task('aave:opera', 'Deploy development enviroment')
  .addFlag('verify', 'Verify contracts at Etherscan')
  .addParam('pool', `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .setAction(async ({verify, pool}, DRE) => {
    const POOL_NAME = pool;
    const network = <EthereumNetworkNames>DRE.network.name;
    await DRE.run('set-DRE');

    // Prevent loss of gas verifying all the needed ENVs for Etherscan verification
    if (verify) {
      checkVerification();
    }

    console.log('Pool: ' + pool);
    console.log('Migration started\n');

    console.log('1. Deploy address provider registry');
    await DRE.run('full:deploy-address-provider-registry');

    console.log('1. Deploy address provider');
    await DRE.run('full:deploy-address-provider', {pool: POOL_NAME});

    console.log('2. Deploy lending pool');
    await DRE.run('full:deploy-lending-pool');

    console.log('3. Deploy oracles');
    await DRE.run('full:deploy-oracles', {pool: POOL_NAME});

    console.log('4. Deploy Data Provider');
    await DRE.run('full:data-provider', {pool: POOL_NAME});

    console.log('5. Initialize lending pool');
    await DRE.run('full:initialize-lending-pool', {pool: POOL_NAME});

    if (verify) {
      printContracts();
      console.log('4. Veryfing contracts');
      await DRE.run('verify:general', {all: true, pool: POOL_NAME});

      console.log('5. Veryfing aTokens and debtTokens');
      await DRE.run('verify:tokens', {pool: POOL_NAME});
    }

    console.log('\nFinished migrations');
    printContracts();
  });
