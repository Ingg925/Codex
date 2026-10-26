# SVP 市场看板：数据接口预留

## 当前实现

默认从 `SVPData.load({mode:'mock'})` 读取固定种子生成的 224 行聚合数据，刷新不会随机改变数字。前端不发送埋点、不持久化个人数据。接口模式已实现 fetch、15 秒超时、HTTP 错误、字段与重复行校验；尚未实现后端、登录或采集服务。

## 推荐真实接入方式

浏览器 → 同源受控后端 `/api/marketing` → 内部数据仓库/索引服务。密钥保存在服务端；后端验证身份、控制权限并脱敏聚合后返回。不要在前端添加数据库或内部 API 凭证。

在有可用且经过鉴权的后端后，把 `app.js` 第一行配置改为：

```js
const DATA_CONFIG = { mode: 'api', endpoint: '/api/marketing' };
```

API 返回 JSON，示例如下（同样是模拟数）：

```json
{
  "timezone": "Asia/Shanghai",
  "asOf": "2026-10-26",
  "rows": [
    {
      "date": "2026-10-13",
      "channel": "X",
      "kol": "KOL-A",
      "campaign": "交易赛",
      "visits": 1000,
      "registrations": 200,
      "deposits": 80,
      "traders": 50,
      "shareClicks": 100,
      "inviteRegistrations": 40,
      "inviteDeposits": 16,
      "inviteTraders": 10,
      "volume": 250000,
      "fees": 75,
      "depositAmount": 24000,
      "withdrawalAmount": 4000,
      "cost": 1000
    }
  ]
}
```

此版本不做服务端筛选或分页，接口需返回当前用户有权查看的完整聚合窗口。大量数据应另加按条件查询、分页、缓存和后端汇总，不能把不完整页当作总数。示例静态服务器不会处理 `/api/marketing`，切换前需由研发新增后端或反向代理；直接切换将报 404，不会悄悄回退到演示数据。

## 行粒度与字段

一行唯一键是 `(date, channel, kol, campaign)`。date 是账户首次访问日，时区 Asia/Shanghai。每个账户唯一归属一个获客日期和归因组合。真实访问须先解决匿名访客与注册账户的身份衔接，再由后端跨日期去重；不能把日活 UV 直接填入可相加的获客人数。跨设备无法识别的用户不得宣称已完成自然人去重。

| 字段 | 类型/单位 | 含义 |
| --- | --- | --- |
| date | YYYY-MM-DD | 首次访问获客批次日，不是成交日 |
| channel / kol / campaign | 非空字符串 | 供界面筛选的标签；内部数据库另外保留稳定 ID |
| visits | 非负整数 | 本批次去重新增访问账户数 |
| registrations | 非负整数 | 本批次截至 asOf 完成注册的账户数 |
| deposits | 非负整数 | 本批次截至 asOf 首次到账交易账户的人数 |
| traders | 非负整数 | 本批次截至 asOf 首次真实成交人数 |
| shareClicks | 非负整数 | 本批次有分享链接点击的去重访问账户数 |
| inviteRegistrations / inviteDeposits / inviteTraders | 非负整数 | 相应转化人数中有有效邀请关系的账户数 |
| volume / fees | 非负数 / USD | 本批次用户截至 asOf 累计真实成交额与手续费 |
| depositAmount / withdrawalAmount | 非负数 / USD | 本批次用户截至 asOf 累计外部入金与出金，排除内部划转 |
| cost | 非负数 / USD | 已分配到该获客批次与维度组合的市场费用 |

漏斗要求 visits ≥ registrations ≥ deposits ≥ traders；邀请转化也必须递减，且不能超过对应总转化数。日与维度之间不得重复归属。真实业务若允许不注册就交易，需要先修改漏斗契约而非硬塞数据。保留“未知来源”“无 KOL”“无活动”，不要丢弃未归因流量。

费用不能在每个获客组合中重复计入同一笔活动预算。建议后端根据核定的渠道/活动费用、获客日期和统一分摊规则生成 cost。换汇也在后端完成，保留币种、汇率、汇率时间的审计记录。

首单 CAC = sum(cost) / sum(traders)，首充 CAC = sum(cost) / sum(deposits)。分母为 0 时前端显示“—”。自然渠道模拟成本为 0，仅为演示假设，不代表业务实际免费。金额展示有四舍五入，底层计算使用原始值。

## 最小事件建议（供研发对齐，尚未采集）

| 事件 | 来源 | 关键条件 |
| --- | --- | --- |
| landing_view | 前端 | event_id、匿名/账户标识、时间、link_id、utm 参数 |
| share_click | 前端 | 分享链接被点击；不要把点击“分享按钮”当成访问 |
| registration_completed | 服务端 | 成功创建账户，与匿名 ID 关联 |
| trading_deposit_confirmed | 账本/链上确认服务 | 实际到账交易账户，transaction_id 去重 |
| trade_filled | 撮合/链上确认服务 | 真正成交，fill_id 去重；首单由服务端识别 |
| withdrawal_confirmed | 账本/链上确认服务 | 外部出金确认，排除内部划转 |
| invitation_bound | 服务端 | inviter_id 与 invitee_id，独立保存关系与归因 |

每个事件统一有 event_id、event_time、received_at、user/account_id、环境、版本。KOL、campaign、channel、creative、link 应保存稳定 ID；钱包/子账户映射、幂等与最终性由服务端处理。测试、内部、已确认刷量账户在聚合前剔除，并保留审计能力。

## 上线前需业务确认

当前演示默认首次触点归因，转化观察截止到 asOf；生产需确认固定转化窗口或采用可变成熟批次的展示方式。还需确认账户映射、有效用户排除规则、费用分摊、币价换算，以及手续费是否扣除返佣/返现。7 日交易留存仅对已满 7 天观察期的首次成交批次计算，不能用本接口缺失的留存字段推测。
