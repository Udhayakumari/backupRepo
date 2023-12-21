/**
 *    SPDX-License-Identifier: Apache-2.0
 */
import { PgService } from "../postgreSQL/PgService";
import { helper } from "../../common/helper";
//Anusha
// import config from '../../platform/fabric/config.json'
const logger = helper.getLogger("CRUDService");
//Anusha
import * as path from "path";
import * as fs from "fs";
import * as FabricConst from "../../platform/fabric/utils/FabricConst";

//Anusha
//Anusha
const config_path = path.resolve(
	__dirname,
	"../../platform/fabric/config.json"
);
const fabric_const = FabricConst.fabric.const;
// Loading the config.json
const all_config = JSON.parse(fs.readFileSync(config_path, "utf8"));
const network_configs = all_config[fabric_const.NETWORK_CONFIGS];

/**
 *
 *
 * @class CRUDService
 */
export class CRUDService {
	sql: PgService;

	constructor(sql: PgService) {
		this.sql = sql;
	}

	/**
	 * Get transactions count by block number
	 *
	 * @param {*} channel_genesis_hash
	 * @param {*} blockNum
	 * @returns
	 * @memberof CRUDService
	 */

	getTxCountByBlockNum(
		network_name: any,
		channel_genesis_hash: any,
		blockNum: any
	) {
		return this.sql.getRowByPkOne(
			"select blocknum ,txcount from blocks where channel_genesis_hash=$1 and blocknum=$2 and network_name = $3",
			[channel_genesis_hash, blockNum, network_name]
		);
	}

	/**
	 * Get transaction by ID
	 *
	 * @param {*} channel_genesis_hash
	 * @param {*} txhash
	 * @returns
	 * @memberof CRUDService
	 */
	getTransactionByID(network_name: any, channel_genesis_hash: any, txhash: any) {
		const sqlTxById = ` select t.txhash,t.validation_code,t.payload_proposal_hash,t.creator_msp_id,t.endorser_msp_id,t.chaincodename,t.type,t.createdt,t.read_set,
				t.write_set,channel.name as channelName from TRANSACTIONS as t inner join channel on t.channel_genesis_hash=channel.channel_genesis_hash and t.network_name=channel.network_name
				where t.txhash = $1 and t.network_name = $2 `;
		return this.sql.getRowByPkOne(sqlTxById, [txhash, network_name]);
	}

	/**
	 * Returns the latest 'n' blocks by channel
	 *
	 * @param {*} channel_genesis_hash
	 * @returns
	 * @memberof CRUDService
	 */

	getBlockActivityList(network_name: any, channel_genesis_hash: any) {
		const sqlBlockActivityList = `select blocks.blocknum,blocks.txcount ,blocks.datahash ,blocks.blockhash ,blocks.prehash,blocks.createdt, (
				SELECT  array_agg(txhash) as txhash FROM transactions where blockid = blocks.blocknum and
				channel_genesis_hash = $1 and network_name = $2 group by transactions.blockid ),
				channel.name as channelname  from blocks inner join channel on blocks.channel_genesis_hash = channel.channel_genesis_hash  where
				blocks.channel_genesis_hash = $1 and blocknum >= 0 and blocks.network_name = $2
				order by blocks.blocknum desc limit 3`;
		return this.sql.getRowsBySQlQuery(sqlBlockActivityList, [
			channel_genesis_hash,
			network_name
		]);
	}

	/**
	 * Returns the list of transactions by channel, organization, date range and greater than a block and transaction id.
	 *
	 * @param {*} channel_genesis_hash
	 * @param {*} blockNum
	 * @param {*} txid
	 * @param {*} from
	 * @param {*} to
	 * @param {*} orgs
	 * @returns
	 * @memberof CRUDService
	 */
	//archana - start
	//oldcode
	// getTxList(
	// 	network_name: any,
	// 	channel_genesis_hash: any,
	// 	blockNum: any,
	// 	txid: any,
	// 	from: any,
	// 	to: any,
	// 	orgs: string
	// ) {
	// 	let sqlTxList = ` select t.creator_msp_id,t.txhash,t.type,t.chaincodename,t.createdt,channel.name as channelName from transactions as t
	//    inner join channel on t.channel_genesis_hash=channel.channel_genesis_hash and t.network_name = channel.network_name where  t.blockid >= $1 and t.id >= $2 and
	// 						t.channel_genesis_hash = $3 and t.network_name = $4 and t.createdt between $5 and $6 `;
	// 	const values = [blockNum, txid, channel_genesis_hash, network_name, from, to];

	// 	if (orgs && orgs.length > 0) {
	// 		sqlTxList += ' and t.creator_msp_id = ANY($7)';
	// 		values.push(orgs);
	// 	}
	// 	sqlTxList += ' order by t.createdt desc';

	// 	return this.sql.getRowsBySQlQuery(sqlTxList, values);
	// }
	// oldcode
	//archana - start
	async getTxList(
		network_name: any,
		channel_genesis_hash: any,
		blockNum: any,
		txid: any,
		from: any,
		to: any,
		orgs: string,
		page: number,
		size: number
	) {
		//console.log("inside db")
		var countOfTxns: number;
		//let countOfTxns: number | Error ;
		let sqlTxList = ` select t.creator_msp_id,t.txhash,t.type,t.chaincodename,t.createdt,channel.name as channelName from transactions as t
       inner join channel on t.channel_genesis_hash=channel.channel_genesis_hash and t.network_name = channel.network_name where  t.blockid >= $1 and t.id >= $2 and
							t.channel_genesis_hash = $3 and t.network_name = $4 and t.createdt between $5 and $6 `;
		const values = [
			blockNum,
			txid,
			channel_genesis_hash,
			network_name,
			from,
			to,
			page,
			size
		];

		// 	if (page == 1) {
		// 		let sqlTxCount = ` select count(*) from transactions as t
		//    inner join channel on t.channel_genesis_hash=channel.channel_genesis_hash and t.network_name = channel.network_name where  t.blockid >= $1 and t.id >= $2 and
		// 						t.channel_genesis_hash = $3 and t.network_name = $4 and t.createdt between $5 and $6 `
		// 		countOfTxns = await this.sql.getRowsCountBySQlQuery(sqlTxCount, [blockNum, txid, channel_genesis_hash, network_name, from, to])
		// 		// //console.log("count>>>>>>",count);
		// 	}
		if (page == 1) {
			let sqlTxCount: string;
			const filterValues = [
				blockNum,
				txid,
				channel_genesis_hash,
				network_name,
				from,
				to
			];
			sqlTxCount = ` select count(*) from transactions as t inner join channel on t.channel_genesis_hash=channel.channel_genesis_hash and t.network_name = channel.network_name
			where t.blockid >= $1 and t.id >= $2 and t.channel_genesis_hash = $3 and t.network_name = $4 and t.createdt between $5 and $6 `;
			if (orgs && orgs.length > 0) {
				sqlTxCount += " and t.creator_msp_id = ANY($7)";
				filterValues.push(orgs);
			}
			//try{
			countOfTxns = await this.sql.getRowsCountBySQlQuery(
				sqlTxCount,
				filterValues
			);
			// } catch (err){
			// 	return err
			// }
			// console.log("countOfTxns", countOfTxns);
		}

		if (orgs && orgs.length > 0) {
			sqlTxList += " and t.creator_msp_id = ANY($9)";
			values.push(orgs);
		}
		sqlTxList += " order by t.createdt desc LIMIT $8 OFFSET (($7 - 1) * $8)";
		let txnsData = await this.sql.getRowsBySQlQuery(sqlTxList, values);
		let response = {
			txnsData: txnsData,
			noOfpages: Math.ceil(countOfTxns / size)
		};
		return response;
	}

	//archana - end
	//archana - end
	/**
	 *
	 * Returns the list of blocks and transactions by channel, organization, date range.
	 *
	 * @param {*} channel_genesis_hash
	 * @param {*} blockNum
	 * @param {*} from
	 * @param {*} to
	 * @param {*} orgs
	 * @returns
	 * @memberof CRUDService
	 */
	// old code
	// getBlockAndTxList(
	// 	network_name: any,
	// 	channel_genesis_hash: any,
	// 	blockNum: any,
	// 	from: any,
	// 	to: any,
	// 	orgs: string[]
	// ) {
	// 	const values = [channel_genesis_hash, network_name, from, to];
	// 	let byOrgs = '';
	// 	if (orgs && orgs.length > 0) {
	// 		values.push(orgs);
	// 		byOrgs = ' and creator_msp_id = ANY($5)';
	// 	}

	// 	logger.debug('getBlockAndTxList.byOrgs ', byOrgs);

	// 	const sqlBlockTxList = `select a.* from  (
	//   select (select c.name from channel c where c.channel_genesis_hash =$1 and c.network_name = $2)
	//   	as channelname, blocks.blocknum,blocks.txcount ,blocks.datahash ,blocks.blockhash ,blocks.prehash,blocks.createdt, blocks.blksize, (
	//     SELECT  array_agg(txhash) as txhash FROM transactions where blockid = blocks.blocknum ${byOrgs} and
	//      channel_genesis_hash = $1 and network_name = $2 and createdt between $3 and $4) from blocks where
	//      blocks.channel_genesis_hash =$1 and blocks.network_name = $2 and blocknum >= 0 and blocks.createdt between $3 and $4
	// 								order by blocks.blocknum desc)  a where  a.txhash IS NOT NULL`;

	// 	logger.debug('sqlBlockTxList ', sqlBlockTxList);
	// 	// console.log("sqlBlockTxList", sqlBlockTxList);

	// 	return this.sql.getRowsBySQlQuery(sqlBlockTxList, values);
	// }
	// // old code

	// // // Udhaya new code -----
	async getBlockAndTxList(
		network_name: any,
		channel_genesis_hash: any,
		blockNum: any,
		from: any,
		to: any,
		orgs: string[],
		page: number,
		size: number
	) {
		var countOfBlocks: any;
		let byOrgs = ' ';
		const values = [channel_genesis_hash, network_name, from, to, page, size];
		if (orgs && orgs.length > 0) {
			values.push(orgs);
			byOrgs = ' and creator_msp_id = ANY($7)';
		}
		let sqlBlockTxList;
		if(orgs == null || orgs.length == 0 ) {
			sqlBlockTxList = `select a.* from  (
				select (select c.name from channel c where c.channel_genesis_hash =$1 and c.network_name = $2) 
					as channelname, blocks.blocknum,blocks.txcount ,blocks.datahash ,blocks.blockhash ,blocks.prehash,blocks.createdt, blocks.blksize, (
				SELECT array_agg(txhash) as txhash FROM transactions where blockid = blocks.blocknum ${byOrgs} and 
				channel_genesis_hash = $1 and network_name = $2 and createdt between $3 and $4) from blocks where
				blocks.channel_genesis_hash =$1 and blocks.network_name = $2 and blocknum >= 0 and blocks.createdt between $3 and $4
											order by blocks.blocknum desc) a where a.txhash IS NOT NULL LIMIT $6 OFFSET (($5 - 1) * $6)`;
		} else {
			sqlBlockTxList =`SELECT c.name AS channelname, 
								b.blocknum, b.txcount, b.datahash, b.blockhash, b.prehash,b.createdt, b.blksize,
								array_agg(t.txhash) AS txhash
							FROM channel c
							INNER JOIN blocks b ON b.channel_genesis_hash = c.channel_genesis_hash AND
								b.network_name = c.network_name
							INNER JOIN transactions t ON t.blockid = b.blocknum AND t.channel_genesis_hash = c.channel_genesis_hash
								AND t.network_name = c.network_name AND t.createdt between $3 and $4 = c.createdt between $3 and $4
								AND t.creator_msp_id IS NOT NULL AND t.creator_msp_id != ' ' AND length(t.creator_msp_id) > 0
							WHERE c.channel_genesis_hash =$1 AND c.network_name = $2 AND b.blocknum >= 0 ${byOrgs} AND b.createdt between $3 and $4
							GROUP BY c.name, b.blocknum, b.txcount, b.datahash, b.blockhash, b.prehash,b.createdt, b.blksize
							ORDER BY b.blocknum DESC
							LIMIT $6 OFFSET (($5 - 1) * $6)
								`;
		}
		if (page == 1) {
			let sqlBlockTxCount: string;
			let byOrgs = ' ';
			const filterValues = [channel_genesis_hash, network_name, from, to];
			if (orgs && orgs.length > 0) {
				filterValues.push(orgs);
				byOrgs = ' and transactions.creator_msp_id = ANY($5)';
			}
			if(orgs == null || orgs.length == 0 ) {
				// console.log("inside orgs", orgs);
				sqlBlockTxCount = `select COUNT(DISTINCT blocks.blocknum) FROM blocks
						JOIN transactions ON blocks.blocknum = transactions.blockid 
						where blockid = blocks.blocknum ${byOrgs} and 
						blocknum >= 0 and blocks.channel_genesis_hash = $1 and blocks.network_name = $2 and 
						blocks.createdt between $3 and $4`
			} else {
				// console.log("else orgs", orgs);
				sqlBlockTxCount = `select COUNT(DISTINCT blocks.blocknum) FROM blocks
						JOIN transactions ON blocks.blocknum = transactions.blockid 
						where blockid = blocks.blocknum ${byOrgs}  
						 and blocks.channel_genesis_hash = $1 and blocks.network_name = $2 and blocks.createdt between $3 and $4
						AND transactions.creator_msp_id IS NOT NULL AND transactions.creator_msp_id != ' ' AND length(creator_msp_id) > 0`
			}
			countOfBlocks = await this.sql.getRowsCountBySQlQuery(
				sqlBlockTxCount,
				filterValues
			);
		}
		let blocksData = await this.sql.getRowsBySQlQuery(sqlBlockTxList, values);
		// console.log('=========blocksData========', blocksData);
		// console.log('====BlockCount=====', countOfBlocks);
		let noOfpages = Math.ceil(countOfBlocks / size);
		let response = {
			blocksData: blocksData,
			noOfpages: noOfpages
		};
		return response;
	}
	/**
	 * Returns channel configuration
	 *
	 * @param {*} channel_genesis_hash
	 * @returns
	 * @memberof CRUDService
	 */

	async getChannelConfig(network_name: any, channel_genesis_hash: any) {
		const channelConfig = await this.sql.getRowsBySQlCase(
			" select * from channel where channel_genesis_hash =$1 and network_name = $2 ",
			[channel_genesis_hash, network_name]
		);
		return channelConfig;
	}

	/**
	 * Returns channel by name, and channel genesis hash
	 *
	 * @param {*} channelname
	 * @param {*} channel_genesis_hash
	 * @returns
	 * @memberof CRUDService
	 */
	async getChannel(
		network_name: any,
		channelname: any,
		channel_genesis_hash: any
	) {
		const channel = await this.sql.getRowsBySQlCase(
			" select * from channel where name=$1 and channel_genesis_hash=$2 and network_name = $3 ",
			[channelname, channel_genesis_hash, network_name]
		);
		return channel;
	}

	/**
	 *
	 * @param {*} channelname
	 * @returns
	 * @memberof CRUDService
	 */
	async existChannel(network_name: any, channelname: any) {
		const channel = await this.sql.getRowsBySQlCase(
			" select count(1) from channel where name=$1 and network_name = $2 ",
			[channelname, network_name]
		);
		return channel;
	}

	/**
	 *
	 *
	 * @param {*} block
	 * @returns
	 * @memberof CRUDService
	 */
	/* eslint-disable */

	async saveBlock(network_name, block, maxHeight: number) {
		const c = await this.sql.getRowByPkOne(
			`select count(1) as c from blocks where blocknum=$1 and txcount=$2
		and channel_genesis_hash=$3 and network_name =$4 and prehash=$5 and datahash=$6 `,
			[
				block.blocknum,
				block.txcount,
				block.channel_genesis_hash,
				network_name,
				block.prehash,
				block.datahash
			]
		);
		//Anusha
		// console.log('--------saveBlock result of c-------- ', c);
		// console.log('--------saveBlock result of isValidRow(c)-------- ', isValidRow(c));
		if (isValidRow(c)) {
			block.network_name = network_name;
			await this.sql.saveRow("blocks", block);
			//Anusha
			let blockValue = await this.sql.updateBySql(
				"select blocks as blockvalue from channel where channel_genesis_hash=$1 and network_name = $2",
				[block.channel_genesis_hash, network_name]
			);
			// console.log("------------blockValue- saveBlock---------", blockValue)
			// console.log("------------maxHeight--saveBlock--------", maxHeight)
			// console.log("------------blockValue[0].blockvalue--saveBlock--------", blockValue[0].blockvalue)

			//Anusha
			if (blockValue[0].blockvalue < maxHeight) {
				let result = await this.sql.updateBySql(
					`update channel set blocks = $1 where channel_genesis_hash=$2 and network_name = $3`,
					[maxHeight, block.channel_genesis_hash, network_name]
				);
				// console.log("------------result----------", result)
			}
			//Anusha
			// let result = await this.sql.updateBySql(
			// 	`update channel set blocks = CASE when blocks< $1 then blocks+1 else $1 END where channel_genesis_hash=$2 and network_name = $3`,
			// 	[maxHeight, block.channel_genesis_hash, network_name]);
			// console.log("------------result----------", result)
			return true;
		}

		return false;
	}

	/* eslint-enable */

	/**
	 *
	 * @param {*} transaction
	 * @returns
	 * @memberof CRUDService
	 */
	async saveTransaction(network_name, transaction, maxHeight: number) {
		// console.log("input parameter in save transaction", network_name,"=========", transaction, "=====",maxHeight)
		const c = await this.sql.getRowByPkOne(
			"select count(1) as c from transactions where blockid=$1 and txhash=$2 and channel_genesis_hash=$3 and network_name = $4 ",
			[
				transaction.blockid,
				transaction.txhash,
				transaction.channel_genesis_hash,
				network_name
			]
		);
		// console.log('----test transact------', c);
		
		//Anusha
		// console.log('=======isValidRow1====', isValidRow(c));

		if (isValidRow(c)) {
			// console.log('-------inside isvalidrow-----', isValidRow(c));
			
			transaction.network_name = network_name;
			// console.log('=====check network_name----', network_name);

			const ab = await this.sql.saveRow("transactions", transaction);
			// console.log('=====check transaction val====================', ab);

			// Anusha
			let blockValue = await this.sql.updateBySql(
				"select blocks as blockvalue from channel where channel_genesis_hash=$1 and network_name = $2",
				[transaction.channel_genesis_hash, network_name]
			);
			// console.log('<<<<<<<<<<blockValue>>>>>>>', blockValue);
			
			// //Udhaya
			// let transValue = await this.sql.updateBySql(
			// 	"select trans as transvalue from channel where channel_genesis_hash=$1 and network_name = $2",
			// 	[transaction.channel_genesis_hash, network_name]
			// );
			// // console.log('<<<<<<<<<<transValue>>>>>>>', transValue);
			// //Udhaya

			// saundarya start
			const chaincodeVersion: any = await this.sql.getRowsBySQlCase(
				"select chaincodeversion as chaincodeVersion from transactions where blockid=$1 and txhash=$2 and channel_genesis_hash=$3 and network_name = $4 ",
				[
					transaction.blockid,
					transaction.txhash,
					transaction.channel_genesis_hash,
					network_name
				]
			);
			// console.log("======Chain Code Version======", chaincodeVersion);
			// console.log("Chain Code Version Logging:::", chaincodeVersion.chaincodeversion);
			// saundarya end

			if (blockValue[0].blockvalue < maxHeight) {
				// console.log("blockValue[0]", blockValue[0].blockvalue);
				let result2 = await this.sql.updateBySql(
					`update channel set trans = $1 where channel_genesis_hash=$2 and network_name = $3`,
					[maxHeight, transaction.channel_genesis_hash, network_name]
				);
				// console.log('=====check block value =====', blockValue[0].blockvalue);
				// console.log("<<<<<<<result2>>>>>", result2);
				
				// Saundarya Start
				let	txCountToBeUpdatedInChaincode:any 
				if (chaincodeVersion.chaincodeversion > 1){
					// console.log ("In Side IF::::::::", chaincodeVersion);
					const previousChaincodeVersion = chaincodeVersion.chaincodeversion - 1;
					// console.log ("previousChaincodeVersion::::::::",previousChaincodeVersion);
					// const txcountInPreviousChaincode: any = await this.sql.getRowsBySQlCase(
					// 	"select txcount as txcountInPreviousChaincode from chaincodes where channel_genesis_hash=$1 and network_name=$2 and version=$3",
					// 	[
					// 		transaction.channel_genesis_hash, 
					// 		network_name,
					// 		previousChaincodeVersion
					// 	]
					// );
					//Udhaya Start
					const txcountInPreviousChaincode: any = await this.sql.getRowsBySQlCase(
						"select trans as txcountInPreviousChaincode from channel where channel_genesis_hash=$1 and network_name=$2",
						[
							transaction.channel_genesis_hash, 
							network_name
						]
					);
					// Udhaya end
					// console.log("txcountInPreviousChaincodetxcountInPreviousChaincodetxcountInPreviousChaincode",txcountInPreviousChaincode);
					//Udhaya start
					// if(txcountInPreviousChaincode == null){
					// 	const chaincode_row = {
					// 		name: transaction.chaincodename,
					// 		version: transaction.chaincodeversion,
					// 		path: path,
					// 		txcount: 0,
					// 		createdt: new Date(),
					// 		channel_genesis_hash: transaction.channel_genesis_hash
					// 	};
					// 	await this.saveChaincode(network_name,chaincode_row);
					// }
					// Udhaya end
					// console.log ("@@@@@txcountInPreviousChaincode::::::::",txcountInPreviousChaincode);
					txCountToBeUpdatedInChaincode =  maxHeight - txcountInPreviousChaincode.txcountinpreviouschaincode;
					// console.log ("txCountToBeUpdatedInChaincode::::::::",txCountToBeUpdatedInChaincode);
					// Saundarya End
				}
				// let result1 = await this.sql.updateBySql(
				// 	"update chaincodes set txcount =$1 where channel_genesis_hash=$2 and network_name = $3 and name=$4 and version=$5",
				// 	[
				// 		txCountToBeUpdatedInChaincode,
				// 		transaction.channel_genesis_hash,
				// 		network_name,
				// 		transaction.chaincodename,
				// 		chaincodeVersion.chaincodeversion
				// 	]
				// );
				let result1 = await this.sql.updateBySql(
					'update chaincodes set txcount =$1 where channel_genesis_hash=$2 and network_name = $3 and name=$4',
					[
						maxHeight,
						transaction.channel_genesis_hash,
						network_name,
						transaction.chaincodename
					]
				);
				// // //Udhaya Start -- chaincode bug
				// // let chaincodeList = await this.sql.updateBySql(
				// // 		"update chaincodes set txcount =$1 where channel_genesis_hash=$2 and network_name = $3 and name=$4 and version=$5",
				// // 		[
				// // 			txCountToBeUpdatedInChaincode,
				// 			// transaction.channel_genesis_hash,
				// 			// network_name,
				// 			// transaction.chaincodename,
				// 			// transaction.chaincodeversion
				// // 		]
				// // 	);
				// // console.log("<<<chaincodeList>>>>>>>>", chaincodeList);
				// const result = await this.sql.updateBySql(`UPDATE chaincodes
				// 		SET chaincodes.txcount = tx.txcount
				// 		FROM (
				// 			SELECT transactions.chaincodeversion, COUNT(*) as txcount
				// 			FROM transactions
				// 			GROUP BY transactions.chaincodeversion
				// 		) AS tx
				// 		WHERE chaincodes.version = tx.chaincodeversion and tx.txcount = $1 and
				// 		channel_genesis_hash=$2 and network_name = $3 and name=$4 and version=$5`,
				// 		[
				// 			transaction.channel_genesis_hash,
				// 			network_name,
				// 			transaction.chaincodename,
				// 			transaction.chaincodeversion,
				// 		]
				// 		);
				// // //Udhaya End -- chaincode bug
				// console.log("------------result1  result2 ----------", result1, result2);
			 }
				// console.log("========outside blockvalue====");
			return true;
		}
		// console.log("========outside valid row====");

		return false;
	}
	// 	if (isValidRow(c)) {
	// 		transaction.network_name = network_name;
	// 		await this.sql.saveRow('transactions', transaction);
	// 		await this.sql.updateBySql(
	// 			'update chaincodes set txcount =txcount+1 where channel_genesis_hash=$1 and network_name = $2 and name=$3',
	// 			[transaction.channel_genesis_hash, network_name, transaction.chaincodename]
	// 		);
	// 		await this.sql.updateBySql(
	// 			'update channel set trans =trans+1 where channel_genesis_hash=$1 and network_name = $2 ',
	// 			[transaction.channel_genesis_hash, network_name]
	// 		);
	// 		return true;
	// 	}

	// 	return false;
	// }

	/**
	 * Returns latest block from blocks table
	 *
	 * @param {*} channel_genesis_hash
	 * @returns
	 * @memberof CRUDService
	 */
	async getCurBlockNum(network_name, channel_genesis_hash) {
		let curBlockNum;
		try {
			const row: any = await this.sql.getRowsBySQlCase(
				"select max(blocknum) as blocknum from blocks  where channel_genesis_hash=$1 and network_name = $2 ",
				[channel_genesis_hash, network_name]
			);

			if (row && row.blocknum) {
				curBlockNum = parseInt(row.blocknum);
			} else {
				curBlockNum = -1;
			}
		} catch (err) {
			logger.error(err);
			return -1;
		}

		return curBlockNum;
	}
	async getBlockByBlocknum(
		network_name: any,
		channel_genesis_hash: any,
		blockNo: any
	) {
		const sqlBlockTxList = `select a.* from  (
				select (select c.name from channel c where c.channel_genesis_hash =$1 and c.network_name = $2) 
					as channelname, blocks.blocknum,blocks.txcount ,blocks.datahash ,blocks.blockhash ,blocks.prehash,blocks.createdt, blocks.blksize, (
				  SELECT  array_agg(txhash) as txhash FROM transactions where blockid = $3 and 
				   channel_genesis_hash = $1 and network_name = $2) from blocks where
				   blocks.channel_genesis_hash =$1 and blocks.network_name = $2 and blocknum = $3)  a where  a.txhash IS NOT NULL`;

		const row: any = await this.sql.getRowsBySQlCase(sqlBlockTxList, [
			channel_genesis_hash,
			network_name,
			blockNo
		]);

		return row;
	}
	/* eslint-disable */
	/**
	 *
	 *
	 * @param {*} chaincode
	 * @memberof CRUDService
	 */
	async saveChaincode(network_name, chaincode) {
		// console.log("++++++++++++++++++Inside saveChaincode network_name ++++++++++++++++++", network_name);
		// console.log("+++++++++++Inside saveChaincode++++++++++", chaincode);
		const c = await this.sql.getRowByPkOne(
			`select count(1) as c from chaincodes where name=$1 and 
		channel_genesis_hash=$2 and network_name = $3 and version=$4 and path=$5`,
			[
				chaincode.name,
				chaincode.channel_genesis_hash,
				network_name,
				chaincode.version,
				chaincode.path
			]
		);
		//Udhaya start --Chaincode Bug
		// const result = `UPDATE chaincodes
		// 				SET txcount = tx.txcount
		// 				FROM (
		// 					SELECT chaincodeversion, COUNT(*) as txcount
		// 					FROM transactions
		// 					GROUP BY chaincodeversion
		// 				) AS tx
		// 				WHERE chaincodes.version = tx.chaincodeversion`;
		// console.log("<<<<MyResult>>>>", result);
		//Udhaya start --Chaincode Bug

		// console.log("<<<<<<<<<SaveChaincode>>>>>>>>>>>> debug +++++++++", c);
		// console.log("===isValidRow(c)===",isValidRow(c));
		if (isValidRow(c)) {
			chaincode.network_name = network_name;
			// console.log("isValidRow", chaincode);
			await this.sql.saveRow("chaincodes", chaincode);
		} 
	}
	
	/* eslint-enable */

	/**
	 *
	 *
	 * @param {*} channel_genesis_hash
	 * @returns
	 * @memberof CRUDService
	 */
	getChannelByGenesisBlockHash(network_name, channel_genesis_hash) {
		return this.sql.getRowByPkOne(
			"select name from channel where channel_genesis_hash=$1 and network_name = $2 ",
			[channel_genesis_hash, network_name]
		);
	}

	/**
	 *
	 *
	 * @param {*} peers_ref_chaincode
	 * @memberof CRUDService
	 */
	async saveChaincodPeerRef(network_name, peers_ref_chaincode) {
		const c = await this.sql.getRowByPkOne(
			"select count(1) as c from peer_ref_chaincode prc where prc.peerid=$1 and prc.chaincodeid=$2 and cc_version=$3 and channelid=$4 and network_name = $5 ",
			[
				peers_ref_chaincode.peerid,
				peers_ref_chaincode.chaincodeid,
				peers_ref_chaincode.cc_version,
				peers_ref_chaincode.channelid,
				network_name
			]
		);

		if (isValidRow(c)) {
			peers_ref_chaincode.network_name = network_name;
			await this.sql.saveRow("peer_ref_chaincode", peers_ref_chaincode);
		}
	}

	/**
	 *
	 *
	 * @param {*} channel
	 * @memberof CRUDService
	 */
	async saveChannel(network_name, channel) {
		const c = await this.sql.getRowByPkOne(
			"select count(1) as c from channel where name=$1 and channel_genesis_hash=$2 and network_name = $3 ",
			[channel.name, channel.channel_genesis_hash, network_name]
		);

		if (isValidRow(c)) {
			await this.sql.saveRow("channel", {
				name: channel.name,
				createdt: channel.createdt,
				blocks: channel.blocks,
				trans: channel.trans,
				channel_hash: channel.channel_hash,
				channel_genesis_hash: channel.channel_genesis_hash,
				network_name: network_name
			});
		} else {
			await this.sql.updateBySql(
				"update channel set blocks=$1,trans=$2,channel_hash=$3 where name=$4 and channel_genesis_hash=$5 and network_name = $6 ",
				[
					channel.blocks,
					channel.trans,
					channel.channel_hash,
					channel.name,
					channel.channel_genesis_hash,
					network_name
				]
			);
		}
	}

	/**
	 *
	 *
	 * @param {*} peer
	 * @memberof CRUDService
	 */
	async savePeer(network_name, peer) {
		const c = await this.sql.getRowByPkOne(
			"select count(1) as c from peer where channel_genesis_hash=$1 and network_name = $2 and server_hostname=$3 ",
			[peer.channel_genesis_hash, network_name, peer.server_hostname]
		);

		if (isValidRow(c)) {
			peer.network_name = network_name;
			await this.sql.saveRow("peer", peer);
		}
	}

	/**
	 *
	 *
	 * @param {*} peers_ref_Channel
	 * @memberof CRUDService
	 */
	async savePeerChannelRef(network_name, peers_ref_Channel) {
		const c = await this.sql.getRowByPkOne(
			"select count(1) as c from peer_ref_channel prc where prc.peerid = $1 and network_name = $2 and prc.channelid=$3 ",
			[peers_ref_Channel.peerid, network_name, peers_ref_Channel.channelid]
		);

		if (isValidRow(c)) {
			peers_ref_Channel.network_name = network_name;
			await this.sql.saveRow("peer_ref_channel", peers_ref_Channel);
		}
	}

	/**
	 *
	 *
	 * @param {*} peerid
	 * @returns
	 * @memberof CRUDService
	 */
	async getChannelsInfo(network_name) {
		const channels = await this.sql.getRowsBySQlNoCondition(
			` select c.id as id,c.name as channelName,c.blocks as blocks ,c.channel_genesis_hash as channel_genesis_hash,c.trans as transactions,c.createdt as createdat,c.channel_hash as channel_hash from channel c,
		peer_ref_channel pc where c.channel_genesis_hash = pc.channelid and c.network_name = $1 group by c.id ,c.name ,c.blocks  ,c.trans ,c.createdt ,c.channel_hash,c.channel_genesis_hash order by c.name `,
			[network_name]
		);

		return channels;
	}

	// Orderer BE-303
	/**
	 *
	 *
	 * @param {*} orderer
	 * @memberof CRUDService
	 */
	async saveOrderer(network_name, orderer) {
		const c = await this.sql.getRowByPkOne(
			"select count(1) as c from orderer where requests=$1 and network_name = $2 ",
			[orderer.requests, network_name]
		);
		if (isValidRow(c)) {
			orderer.network_name = network_name;
			await this.sql.saveRow("orderer", orderer);
		}
	}
	// Orderer BE-303

	//Function to delete the data after some days - days to be configured in config.json
	//Anusha --start

	async deleteOldData(
		channel_genesis_hash: string,
		network_id: string,
		daysToPurge: number
	) {
		//Fetching the blockto and block from value as per the days required
		let blockfrom = await this.sql.updateBySql(
			`SELECT CASE WHEN min(blocknum) is null THEN 0 ELSE MIN(blocknum) end as blockfrom FROM blocks WHERE createdt < CURRENT_DATE - INTERVAL '1 day' *$1 and  channel_genesis_hash=$2 and network_name = $3`,
			[daysToPurge, channel_genesis_hash, network_id]
		);
		let blockto = await this.sql.updateBySql(
			`SELECT CASE WHEN MAX(blocknum) is null THEN 0 ELSE MAX(blocknum) end as blockto FROM blocks WHERE createdt < CURRENT_DATE - INTERVAL '1 day' *$1 and channel_genesis_hash=$2 and network_name = $3`,
			[daysToPurge, channel_genesis_hash, network_id]
		);
		if (blockto[0].blockto != 0) {
			//Deleting the txn and blocks table
			await this.sql.updateBySql(
				`DELETE FROM transactions WHERE blockid>= $1 and blockid<=$2 and channel_genesis_hash=$3 and network_name = $4`,
				[
					blockfrom[0].blockfrom,
					blockto[0].blockto,
					channel_genesis_hash,
					network_id
				]
			);
			await this.sql.updateBySql(
				`DELETE FROM blocks WHERE blocknum>= $1 and blocknum<=$2 and channel_genesis_hash=$3 and network_name = $4`,
				[
					blockfrom[0].blockfrom,
					blockto[0].blockto,
					channel_genesis_hash,
					network_id
				]
			);
			await this.explorerTableUpdation(
				blockfrom[0].blockfrom,
				blockto[0].blockto,
				FabricConst.PurgeModes.TIME, 
				channel_genesis_hash,
				network_id
			);
			return true;
		}
		return false;
	}

	async fetchLastBlockToFromExplorerAudit(
		mode: string,
		channel_genesis_hash: string,
		network_id: string
	) {
		// console.log("+++================fetchlastblock check===============");
		let blocktoValue = await this.sql.updateBySql(
			`SELECT blockto FROM explorer_audit where mode =$1 and channel_genesis_hash=$2 and network_name = $3`,
			[mode, channel_genesis_hash, network_id]
		);
		return blocktoValue[0].blockto;
	}

	// async deleteBlock(network_name: string, channel_genesis_hash: string, blockCount: number) {
	// 	const count: any = await this.sql.getRowsBySQlCase(
	// 		' select count(*) as count from blocks  where channel_genesis_hash=$1 and network_name = $2 ',
	// 		[channel_genesis_hash, network_name]
	// 	);
	// 	const rowCount: number = count.count;
	// 	let rowsToDelete: number = 0;
	// 	if (rowCount > blockCount) {
	// 		rowsToDelete = rowCount - blockCount;
	// 	}
	// 	if (rowsToDelete > 0) {
	// 		let blockfrom = await this.sql.updateBySql(
	// 			`SELECT min(blocknum) as blockfrom FROM blocks WHERE channel_genesis_hash=$1 and network_name = $2`, [channel_genesis_hash, network_name]);
	// 		let blockto = await this.sql.updateBySql(
	// 			`SELECT max(blocknum) as blockto FROM blocks WHERE channel_genesis_hash=$1 and network_name = $2`, [channel_genesis_hash, network_name]);
	// 		await this.sql.updateBySql(
	// 			`delete from transactions where blockid in ( select blocknum from blocks where channel_genesis_hash=$1 and network_name = $2 order by blocknum limit $3) `,
	// 			[channel_genesis_hash, network_name, rowsToDelete]
	// 		);
	// 		await this.sql.updateBySql(
	// 			`delete from blocks where id in ( select id from blocks where channel_genesis_hash=$1 and network_name = $2 order by blocknum limit $3) `,
	// 			[channel_genesis_hash, network_name, rowsToDelete]
	// 		);
	// 		await this.explorerTableUpdation(
	// 			blockfrom[0].blockfrom, blockto[0].blockto - blockCount, "BLOCKCOUNT", channel_genesis_hash, network_name);

	// 		return true;
	// 	}
	// 	return false;
	// }
	async deleteBlock(
		network_name: string,
		channel_genesis_hash: string,
		blockCount: number
	) {
		const count: any = await this.sql.getRowsBySQlCase(
			" select count(*) as count from blocks  where channel_genesis_hash=$1 and network_name = $2 ",
			[channel_genesis_hash, network_name]
		);
		const rowCount: number = count.count;
		let rowsToDelete: number = 0;
		if (rowCount > blockCount) {
			rowsToDelete = rowCount - blockCount;
		}
		if (rowsToDelete > 0) {
			let blockfrom = await this.sql.updateBySql(
				`SELECT min(blocknum) as blockfrom FROM blocks WHERE channel_genesis_hash=$1 and network_name = $2`,
				[channel_genesis_hash, network_name]
			);
			let blockto = await this.sql.updateBySql(
				`SELECT max(blocknum) as blockto FROM blocks WHERE channel_genesis_hash=$1 and network_name = $2`,
				[channel_genesis_hash, network_name]
			);
			await this.sql.updateBySql(
				`DELETE FROM transactions WHERE blockid>= $1 and blockid<=$2 and channel_genesis_hash=$3 and network_name = $4`,
				[
					blockfrom[0].blockfrom,
					blockto[0].blockto - blockCount,
					channel_genesis_hash,
					network_name
				]
			);
			await this.sql.updateBySql(
				`DELETE FROM blocks WHERE blocknum>= $1 and blocknum<=$2 and channel_genesis_hash=$3 and network_name = $4`,
				[
					blockfrom[0].blockfrom,
					blockto[0].blockto - blockCount,
					channel_genesis_hash,
					network_name
				]
			);
			await this.explorerTableUpdation(
				blockfrom[0].blockfrom,
				blockto[0].blockto - blockCount,
				FabricConst.PurgeModes.BLOCKCOUNT,
				channel_genesis_hash,
				network_name
			);

			return true;
		}
		return false;
	}

	async explorerTableUpdation(
		blockFrom: number,
		blockTo: number,
		purgeMode: string,
		channel_genesis_hash: string,
		network_name: string
	) {
		const updateReponse = await this.sql.updateBySql(
			`insert into explorer_audit (lastupdated,status,blockfrom,blockto,mode,channel_genesis_hash,network_name) values ($1,$2,$3,$4,$5,$6,$7) on conflict(mode,channel_genesis_hash,network_name) 
			do update set lastupdated = $1, status = $2, blockfrom = $3, blockto = $4, mode = $5, channel_genesis_hash =$6,network_name= $7 `,
			[
				new Date(),
				"SUCCESS",
				blockFrom,
				blockTo,
				purgeMode,
				channel_genesis_hash,
				network_name
			]
		);
		logger.info(" Data added to explorer_audit table", updateReponse);
	}
	////Anusha --end

	// async deleteData(network_name: string, channel_genesis_hash: string, blockCount: number, purgeMode: string) {
	// 	let blockfrom, blockto: any;
	// 	if (purgeMode == "blockcount") {
	// 		const count: any = await this.sql.getRowsBySQlCase(
	// 			' select count(*) as count from blocks  where channel_genesis_hash=$1 and network_name = $2 ',
	// 			[channel_genesis_hash, network_name]
	// 		);
	// 		const rowCount: number = count.count;
	// 		let rowsToDelete: number = 0;
	// 		if (rowCount > blockCount) {
	// 			rowsToDelete = rowCount - blockCount;
	// 		}
	// 		if (rowsToDelete > 0) {
	// 			//Modification of PR#341
	// 			blockfrom = await this.sql.updateBySql(
	// 				`SELECT min(blocknum) as blockfrom FROM blocks WHERE channel_genesis_hash=$1 and network_name = $2`, [channel_genesis_hash, network_name]);
	// 			blockto = await this.sql.updateBySql(
	// 				`SELECT max(blocknum) as blockto FROM blocks WHERE channel_genesis_hash=$1 and network_name = $2`, [channel_genesis_hash, network_name]);
	// 			await this.sql.updateBySql(
	// 				`delete from transactions where blockid in ( select blocknum from blocks where channel_genesis_hash=$1 and network_name = $2 order by blocknum limit $3) `,
	// 				[channel_genesis_hash, network_name, rowsToDelete]
	// 			);

	// 			await this.sql.updateBySql(
	// 				`delete from blocks where id in ( select id from blocks where channel_genesis_hash=$1 and network_name = $2 order by blocknum limit $3) `,
	// 				[channel_genesis_hash, network_name, rowsToDelete]
	// 			);
	// 			// return true;
	// 		}
	// 		// return false;
	// 	}
	// 	if (purgeMode == "time") {
	// 		const daysToPurge = network_configs[network_name].daysToPurge;
	// 		//Fetching the blockto and block from value as per the days required
	// 		blockfrom = await this.sql.updateBySql(
	// 			`SELECT CASE WHEN min(blocknum) is null THEN 0 ELSE MIN(blocknum) end as blockfrom FROM blocks WHERE createdt < CURRENT_DATE - INTERVAL '1 day' *$1 and  channel_genesis_hash=$2 and network_name = $3`,
	// 			[daysToPurge, channel_genesis_hash, network_name]);
	// 		blockto = await this.sql.updateBySql(
	// 			`SELECT CASE WHEN MAX(blocknum) is null THEN 0 ELSE MAX(blocknum) end as blockto FROM blocks WHERE createdt < CURRENT_DATE - INTERVAL '1 day' *$1 and channel_genesis_hash=$2 and network_name = $3`,
	// 			[daysToPurge, channel_genesis_hash, network_name]);
	// 		if (blockto[0].blockto != 0) {
	// 			//Deleting the txn and blocks table
	// 			await this.sql.updateBySql(
	// 				`DELETE FROM transactions WHERE blockid>= $1 and blockid<=$2 and channel_genesis_hash=$3 and network_name = $4`,
	// 				[blockfrom[0].blockfrom, blockto[0].blockto, channel_genesis_hash, network_name]
	// 			);
	// 			await this.sql.updateBySql(
	// 				`DELETE FROM blocks WHERE blocknum>= $1 and blocknum<=$2 and channel_genesis_hash=$3 and network_name = $4`,
	// 				[blockfrom[0].blockfrom, blockto[0].blockto, channel_genesis_hash, network_name]
	// 			);

	// 			// return true;
	// 		}
	// 		// return false;
	// 	}
	// 	const updateReponse = await this.sql.updateBySql(
	// 		`insert into explorer_audit (id,lastupdated,status,blockfrom,blockto,mode) values (1,$1,$2,$3,$4,$5) on conflict(id) do update set lastupdated = $1, status = $2, blockfrom = $3, blockto = $4, mode = $5 `,
	// 		[new Date(), "SUCCESS", blockfrom[0].blockfrom, blockto[0].blockto, purgeMode]);
	// 	console.log("-----------updateReponse------", updateReponse);
	// }
}

/**
 *
 *
 * @param {*} rowResult
 * @returns
 */
function isValidRow(rowResult) {
	if (rowResult) {
		const val = rowResult.c;
		if (val === 0 || val === "0") {
			return true;
		}
	}
	return false;
}
