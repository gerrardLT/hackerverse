# 智能合约部署记录

此目录包含HackX项目智能合约在各个网络上的部署信息。

## 部署文件格式

每个网络的部署信息存储在 `{network}.json` 文件中，包含以下信息：

```json
{
  "network": "polygon",
  "chainId": 137,
  "contractAddress": "0x...",
  "deployer": "0x...",
  "deploymentTx": "0x...",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "block": 12345678,
  "verified": true,
  "verifiedAt": "2024-01-15T10:45:00.000Z"
}
```

## 支持的网络

### 主网
- `mainnet.json` - 以太坊主网
- `polygon.json` - Polygon主网
- `arbitrumOne.json` - Arbitrum One
- `optimism.json` - Optimism主网

### 测试网
- `sepolia.json` - Sepolia测试网
- `polygonMumbai.json` - Polygon Mumbai测试网

## 部署命令

### 部署到测试网 (推荐先测试)
```bash
# 部署到Sepolia测试网
npx hardhat run scripts/deploy-production.js --network sepolia

# 部署到Polygon Mumbai
npx hardhat run scripts/deploy-production.js --network polygonMumbai
```

### 部署到主网
```bash
# 部署到Polygon主网
npx hardhat run scripts/deploy-production.js --network polygon

# 部署到以太坊主网
npx hardhat run scripts/deploy-production.js --network mainnet
```

## 合约验证

部署完成后，运行验证脚本：

```bash
# 验证Polygon上的合约
npx hardhat run scripts/verify-contract.js --network polygon
```

## 配置更新

部署和验证完成后，更新项目配置：

```bash
# 自动更新所有配置文件
node scripts/update-config.js polygon

# 或手动指定合约地址
node scripts/update-config.js polygon 0x1234567890123456789012345678901234567890
```

## 安全注意事项

1. **私钥安全**: 绝不要将私钥提交到代码库
2. **环境变量**: 使用 `.env` 文件存储敏感信息
3. **Gas费用**: 部署前检查当前Gas价格
4. **合约验证**: 部署后立即验证合约源码
5. **备份**: 保存部署信息和交易哈希

## 故障排除

### 常见问题

1. **Gas费用不足**
   ```
   Error: insufficient funds for gas * price + value
   ```
   解决：确保部署账户有足够的ETH支付Gas费用

2. **RPC URL错误**
   ```
   Error: could not detect network
   ```
   解决：检查环境变量中的RPC URL是否正确

3. **合约已存在**
   ```
   Error: contract creation code storage out of gas
   ```
   解决：可能是合约已部署，检查部署记录

### 联系方式

如遇到部署问题，请检查：
1. 网络配置是否正确
2. 账户余额是否充足
3. RPC节点是否可用
4. Gas价格设置是否合理
