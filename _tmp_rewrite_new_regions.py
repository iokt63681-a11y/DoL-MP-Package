# -*- coding: utf-8 -*-
import re, os, sys

ROOT = r"C:\Users\24893\Downloads\DoL-MP-Package-GitHub"
PATH = os.path.join(ROOT, "mod-src", "twees", "mp-new-regions.twee")

SUB_NAME = {
 "foghorn_pier": "MP Region Foghorn Pier",
 "foghorn_keeper": "MP Region Foghorn Keeper",
 "foghorn_wreck": "MP Region Foghorn Wreck",
 "foghorn_echo": "MP Region Foghorn Echo",
 "clockwork_corridor": "MP Region Clockwork Corridor",
 "clockwork_steam": "MP Region Clockwork Steam",
 "clockwork_astro": "MP Region Clockwork Astro",
 "clockwork_vault": "MP Region Clockwork Vault",
 "abbey_steps": "MP Region Abbey Steps",
 "abbey_confess": "MP Region Abbey Confess",
 "abbey_scriptorium": "MP Region Abbey Scriptorium",
 "abbey_ferry": "MP Region Abbey Ferry",
 "glasshouse_orchid": "MP Region Glasshouse Orchid",
 "glasshouse_specimen": "MP Region Glasshouse Specimen",
 "glasshouse_dome": "MP Region Glasshouse Dome",
 "glasshouse_cellar": "MP Region Glasshouse Cellar",
 "blackiron_siding": "MP Region Blackiron Siding",
 "blackiron_armored": "MP Region Blackiron Armored",
 "blackiron_signal": "MP Region Blackiron Signal",
 "blackiron_platform": "MP Region Blackiron Platform",
 "druid_pillars": "MP Region Druid Pillars",
 "druid_moonwell": "MP Region Druid Moonwell",
 "druid_rootcave": "MP Region Druid Rootcave",
 "druid_watchtower": "MP Region Druid Watchtower",
 "velvet_masque": "MP Region Velvet Masque",
 "velvet_salon": "MP Region Velvet Salon",
 "velvet_terrace": "MP Region Velvet Terrace",
 "velvet_auction": "MP Region Velvet Auction",
 "observatory_dome": "MP Region Observatory Dome",
 "observatory_star": "MP Region Observatory Star",
 "observatory_cabinet": "MP Region Observatory Cabinet",
 "observatory_bridge": "MP Region Observatory Bridge",
}
REGION_OF = {}
for k in SUB_NAME:
    if k.startswith("foghorn"): REGION_OF[k] = "Foghorn"
    elif k.startswith("clockwork"): REGION_OF[k] = "Clockwork"
    elif k.startswith("abbey"): REGION_OF[k] = "Abbey"
    elif k.startswith("glasshouse"): REGION_OF[k] = "Glasshouse"
    elif k.startswith("blackiron"): REGION_OF[k] = "Blackiron"
    elif k.startswith("druid"): REGION_OF[k] = "Druid"
    elif k.startswith("velvet"): REGION_OF[k] = "Velvet"
    elif k.startswith("observatory"): REGION_OF[k] = "Observatory"
ORDER = {
 "Foghorn": ["foghorn_pier", "foghorn_keeper", "foghorn_wreck", "foghorn_echo"],
 "Clockwork": ["clockwork_corridor", "clockwork_steam", "clockwork_astro", "clockwork_vault"],
 "Abbey": ["abbey_steps", "abbey_confess", "abbey_scriptorium", "abbey_ferry"],
 "Glasshouse": ["glasshouse_orchid", "glasshouse_specimen", "glasshouse_dome", "glasshouse_cellar"],
 "Blackiron": ["blackiron_siding", "blackiron_armored", "blackiron_signal", "blackiron_platform"],
 "Druid": ["druid_pillars", "druid_moonwell", "druid_rootcave", "druid_watchtower"],
 "Velvet": ["velvet_masque", "velvet_salon", "velvet_terrace", "velvet_auction"],
 "Observatory": ["observatory_dome", "observatory_star", "observatory_cabinet", "observatory_bridge"],
}
ENTRY = {
 "Foghorn": "MP Region Foghorn Island",
 "Clockwork": "MP Region Clockwork Undercity",
 "Abbey": "MP Region Sunken Abbey",
 "Glasshouse": "MP Region Glasshouse Manor",
 "Blackiron": "MP Region Blackiron Yard",
 "Druid": "MP Region Druid Circle",
 "Velvet": "MP Region Velvet Mirage",
 "Observatory": "MP Region Observatory Wing",
}
FRAG = {
 "Foghorn": "mpFragSmugglerRing",
 "Clockwork": "mpFragCrownGear",
 "Abbey": "mpFragAbyssPage",
 "Glasshouse": "mpFragBrideFlower",
 "Blackiron": "mpFragLedgerKey",
 "Druid": "mpFragBrideFlower",
 "Velvet": "mpFragVelvetCrest",
 "Observatory": "mpFragCrownGear",
}

S = {}

S["foghorn_pier"] = dict(
 short="雾角栈桥",
 obs=("比对系船柱刻痕", 3, "socialiseicon", "$athletics gte 260 or $skulduggery gte 240",
  "你抹开青苔，看见柱身上六道新刻的粉笔痕，绳结是走私船惯用的双套结。刻痕末端指向半山腰的守塔人旧居。",
  "海风把粉笔灰吹得干干净净，你只摸到一手湿滑苔藓，没看出绳结的门道。"),
 nxt=("沿铁索上旧居", 6), ret=("顺栈桥退回岛口", 4),
 a=("撬开牡蛎暗槽", 8, 300,
  "你避开壳缘掀开黄铜匣，取出一枚船锚徽记、半枚印戒和一叠旧港银币，约 £3。匣盖内侧还刻着守塔人的姓。",
  "你从槽底拈出一只铜扣皮袋，里面是两枚磨亮的旧港银币；袋口沾着守塔人常用的松脂，说明有人常来这里。",
  "浪头漫过台阶，牡蛎壳在你指腹上划开一道口子。你缩回手，暗槽里的匣子仍卡在原处。", 2),
 b=("比对缆绳系法", 6, "$science gte 240 or $athletics gte 260",
  "你认出这是走私船的双套结，绳尾的六道刻痕与守塔人旧居门框上的划痕一致。",
  "湿绳在掌心打转，你只看出这是普通系船结，没能读出更多东西。", 2),
 money=(300, 200),
)

S["foghorn_keeper"] = dict(
 short="守塔人旧居",
 obs=("翻看潮汐手札", 3, "investigateicon", "$history gte 260 or $housekeeping gte 240",
  "你翻到一页被撕去大半的潮汐记录，残角写着“退潮后把箱子挪去断桅滩”。炉灰里还埋着半枚黄铜星盘。",
  "手札受潮粘成一叠，你只辨认出几个模糊日期，没能串起完整的去向。"),
 nxt=("沿暗阶下断桅滩", 8), ret=("沿石阶退回岛口", 4),
 a=("叩壁炉活砖", 10, 340,
  "你抽出松动的青砖，从烟道侧取出油纸包：一只黄铜星盘、半枚印戒残片和一张写有“断桅滩”的油纸。",
  "你拉开木桌暗抽屉，在旧海图下找到一本被海水泡皱的潮汐簿，夹着半张标有断桅滩的草图。",
  "烟道里落下一蓬陈年煤灰，迷得眼眶发酸，手背也在石棱上蹭破了皮。你空手退回屋中央。", 2),
 b=("读值班记录", 6, "$history gte 260 or $english gte 240",
  "你顺着墨迹读出一行交接记录：守塔人把几只锡箱搬去了东边的断桅沉船滩。",
  "纸页被炉烟熏得发脆，关键词句一碰就碎，你只读到半句没头没尾的潮位。", 2),
 money=(0, 0),
)

S["foghorn_wreck"] = dict(
 short="断桅沉船滩",
 obs=("眺望退潮礁脊", 3, "investigateicon", "$swimmingskill gte 260 or $athletics gte 300",
  "退潮后的礁脊上留着一串新鲜靴印，径直通向崖底的海蚀回音廊；印边还有一小片被踩碎的白色盐晶。",
  "浪沫不断抹平湿沙，你只看见几只海鸥在礁石上起落，没找到可跟的痕迹。"),
 nxt=("沿礁脊去回音廊", 9), ret=("沿卵石滩退回岛口", 4),
 a=("撬开肋木锡盒", 12, 380,
  "你发力撬开藤壶包裹的锡盒：一枚航海古物、半枚印戒残片，以及约 £4 的银元。盒盖内侧刻着走私船的编号。",
  "你从底舱湿沙槽里扒出一只铜扣皮袋，里面是几枚被海水洗亮的旧银币，约 £3；袋里还夹着一小片舱单。",
  "腐朽的橡木横梁突然下沉，你连忙抽身，手腕还是被生锈船钉刮出一道红痕。锡盒没能取出来。", 3),
 b=("辨湿沙靴印", 6, "$athletics gte 280 or $swimmingskill gte 240",
  "你蹲下比对靴印深浅，顺着退潮水线一路追到回音廊入口，还在石缝里捡到一枚铜扣。",
  "下一波浪头漫过沙面，靴印边缘立刻糊成一片，你只来得及看清半步。", 2),
 money=(400, 300),
)

S["foghorn_echo"] = dict(
 short="海蚀回音廊",
 obs=("贴壁辨听回声", 3, "investigateicon", "$willpower gte 460 or $science gte 260",
  "你避开层层叠叠的假回声，听出最深处有一处干燥石龛；风从龛口灌入时，会带出一声极轻的金属颤音。",
  "重叠的回声在耳畔打转，你分不清哪一道来自气孔、哪一道只是自己的脚步。"),
 nxt=None, ret=("沿石拱退回岛口", 4),
 a=("探螺旋气孔", 12, 360,
  "你抠开蜂蜡封口，取出一支完好的定音古音叉和半枚印戒残片；暗槽底部压着一小片写着“六响”的铜牌。",
  "你从气孔内侧夹出几枚黑珍珠母贝与一枚旧钱币；槽壁上还留着指甲划出的六道短痕。",
  "气孔里骤然喷出一股夹着盐粒的水雾，啸声震得耳膜生疼。你踉跄后退，没能取出槽里的东西。", 2),
 b=("听辨风鸣方位", 6, "$science gte 260 or $willpower gte 460",
  "你顺着共鸣最稳的那道石缝摸过去，发现一处被盐晶半封的干龛，里面有一枚刻着船锚的铜扣。",
  "回声忽高忽低，你贴壁听了半晌，只落得满耳嗡鸣，没找到干龛。", 2),
 money=(0, 0),
)

S["clockwork_corridor"] = dict(
 short="齿轮回廊",
 obs=("数擒纵咬合声", 3, "investigateicon", "$science gte 250 or $maths gte 250",
  "你数准主擒纵叉每三秒一次的停顿，发现轴承旁有一道新上的机油痕，顺着它能看到蒸汽压力室的检修门。",
  "齿轮的咬合声密得像雨点，你数到一半就乱了拍子，只觉耳膜发胀。"),
 nxt=("沿机油痕去压力室", 7), ret=("沿铁梯退回机括城口", 4),
 a=("摸主轴检修槽", 9, 330,
  "你趁大齿轮转过缺口的瞬间勾出绒布匣：一枚精密擒纵轮、半枚王冠齿轮残片和一张工坊收据。",
  "你用铁钩从排油槽滤网上挑起一只油纸包，里面是两枚机工藏起的银币和一小截刻着编号的铜丝。",
  "从动轮突然加速回咬，滚烫的润滑油溅在手背上，你猛地抽手后退，槽底的东西没摸到。", 3),
 b=("读检修铭牌", 6, "$science gte 260 or $maths gte 260",
  "你顺着铭牌上的红色箭头读出管线走向，确认西侧阀门通道通向蒸汽压力室。",
  "铭牌被油泥糊住大半，你只认出几个互相矛盾的箭头。", 2),
 money=(0, 0),
)

S["clockwork_steam"] = dict(
 short="蒸汽压力室",
 obs=("看压力表回摆", 3, "investigateicon", "$science gte 280 or $physique gte 11500",
  "你盯住水银柱的细微回摆，判断出备用管正在缓慢泄压；管壁上的粉笔箭头指向停摆天文台。",
  "白雾糊住表盘，你只看见指针在红线附近乱颤，不敢贸然靠近。"),
 nxt=("沿干管去天文台", 10), ret=("沿铁廊退回机括城口", 4),
 a=("拧盲端法兰", 10, 360,
  "你卸下法兰盖，从干燥管腔里抽出一卷黄铜蓝图和半枚王冠齿轮残片；图纸筒底还塞着约 £4 的工程备用金。",
  "你从仪表墙后的锡盒里翻出两枚封装完好的旧银元和一张标着“天文台”的管线草图。",
  "法兰接缝里窜出一股滚烫余压，灼得手指剧痛，扳手也砸在脚背上。你只好退回来。", 3),
 b=("对照管线图", 6, "$science gte 280 or $maths gte 260",
  "你把冷凝水痕和管线图对上，找到了通往停摆天文台的升降暗门。",
  "图上的管线交叉太多，你看了半天仍不敢确定哪一根通往上层。", 2),
 money=(400, 0),
)

S["clockwork_astro"] = dict(
 short="停摆天文台",
 obs=("对黄道刻度", 3, "investigateicon", "$maths gte 280 or $history gte 280",
  "你发现天蝎座刻度被反复摩挲得发亮，底座侧面还有一道新添划痕，正对着档案馆密库的防爆门方向。",
  "黄道铜环层层叠叠，你看得眼花，没能记住哪一格被动过。"),
 nxt=("沿配重井去密库", 12), ret=("沿铁旋梯退回机括城口", 4),
 a=("拨赤纬铜环", 13, 400,
  "黄道暗格应声弹开，你取出一枚镶水晶的古星象仪和半枚王冠齿轮残片；绒垫下压着一张标着密库编号的卡片。",
  "你旋开观测台扶手下的黄铜储物筒，倒出两枚成色极好的银币和一小卷画着齿轮比的手稿。",
  "断裂的发条钢带从主轴上弹开，抽在手腕上，底座机括死死卡住。你揉着手腕退回来。", 3),
 b=("比照星图底稿", 7, "$maths gte 280 or $history gte 280",
  "你把星图底稿和铜环刻度对上，推出一组开锁顺序，尽头正是档案馆密库的十二号柜。",
  "两张星图的岁差标法不同，你算到一半便推不下去。", 3),
 money=(0, 0),
)

S["clockwork_vault"] = dict(
 short="档案馆密库",
 obs=("看柜脚滑轨", 3, "investigateicon", "$maths gte 300 or $skulduggery gte 320",
  "你注意到 A 到 M 号柜的滑轨磨损并不均匀，十二号柜底座有一道被反复拉开的亮痕。",
  "铁柜底座积着厚灰，你只看见一排差不多的滑轨，分不出哪只常被打开。"),
 nxt=None, ret=("沿防爆门退回机括城口", 4),
 a=("拨十二号底板", 14, 440,
  "底板咔哒弹起，你取出未公开的市政厅古物和半枚王冠齿轮残片；夹层信封里还有一张约 £5 的不记名银票。",
  "你从差分机摇柄旁的铁盒里摸出两张早年兑付券和一枚旧银币，券面盖着市政厅的褪色印章。",
  "双层底板的防盗弹簧回弹夹住指尖，密库顶部的警报铜铃轻响一声。你连忙抽手退到门边。", 3),
 b=("摇差分机手柄", 8, "$maths gte 300 or $science gte 280",
  "差分机咔嗒吐出一截纸带，上面打着一组柜号和一个人名，末尾还标着“未归档”。",
  "手柄摇到一半便卡死，纸带只吐出半行乱码。", 2),
 money=(500, 0),
)

S["abbey_steps"] = dict(
 short="静默石阶",
 obs=("数石像手势", 3, "investigateicon", "$history gte 260 or $willpower gte 440",
  "你发现第三尊无面石像的双手是反叠的，指节朝向石阶西侧的胡桃木侧门；门缝里透出一线昏黄。",
  "石像轮廓在长明灯下忽明忽暗，你数到一半便觉得每尊都差不多。"),
 nxt=("沿侧门去回音壁", 5), ret=("沿石阶退回修道院口", 4),
 a=("摸石兽腹腔", 10, 320,
  "你从石兽腹腔暗槽里取出一只鹿皮袋：古教团圣徽、半页深渊羊皮残片和一枚奉纳银币。",
  "你在石像底座的奉纳钵下翻出两枚旧银币和一张写着“回音壁”的蜡封纸条。",
  "石兽口中的断齿刮伤手腕，腹腔里的冷蜘蛛网粘了一手。你急忙缩手，没摸到暗槽里的东西。", 2),
 b=("辨认奉纳铭文", 6, "$history gte 260 or $purity gte 500",
  "你读懂了奉纳钵上的拉丁短句，末尾提到“西侧告解隔扇”，并画着一个小小的十字。",
  "铭文被香灰磨平了大半，你只认出两个不成句的词。", 2),
 money=(0, 0),
)

S["abbey_confess"] = dict(
 short="告解回音壁",
 obs=("听隔间传声", 3, "investigateicon", "$skulduggery gte 260 or $willpower gte 450",
  "你听见穹顶把远处翻书声送进第三间隔间，跪凳下方有一块木榫被反复摩挲得发亮；隔扇后连着藏经阁的石廊。",
  "传声孔里只有忽远忽近的风声，你分不清哪些是脚步、哪些是回声。"),
 nxt=("沿石廊去藏经阁", 11), ret=("沿侧门退回修道院口", 4),
 a=("撬跪凳暗槽", 10, 350,
  "木榫弹开，你取出一枚纯银十字架和半页深渊古卷残片；绒布下压着约 £3 的赎罪银币。",
  "你在隔间丝绒跪垫夹层里摸出两枚信徒遗落的旧银币和一张写着“北侧书架”的纸条。",
  "木榫卡得极紧，刀尖一滑在胡桃木板上刮出刺耳锐响，声学穹顶把声音传遍四方。你连忙收手。", 2),
 b=("查看告解残页", 7, "$history gte 260 or $english gte 240",
  "你在传声孔后找到半张告解记录，末尾写着“灰烬藏经阁的抄经台”，墨迹被水晕开。",
  "纸页一碰就碎，你只读到半句没有主语的祷告。", 2),
 money=(300, 0),
)

S["abbey_scriptorium"] = dict(
 short="灰烬藏经阁",
 obs=("闻羊皮卷气味", 3, "investigateicon", "$history gte 280 or $tending gte 240",
  "你闻到雪松油和潮气混在一起，最里侧书架后有一道被灰烬掩住的暗阶，水声正从下面传来。",
  "陈年烟灰味呛得鼻子发酸，你只看见一排排焦黑书架，没辨出暗阶。"),
 nxt=("沿暗阶去渡口", 8), ret=("沿书架退回修道院口", 4),
 a=("旋抄经立柱", 12, 380,
  "立柱暗格缓缓旋开，你抽出半部金粉誊写的秘典和半页深渊羊皮残片；底座下压着一枚旧藏银币。",
  "你在压书机下方的木匣里翻出两枚未受火损的银币和一张标着“暗河渡口”的书签。",
  "生锈铜螺杆纹丝不动，反倒震落书架顶层一块焦木，擦着肩膀砸在脚边。你惊魂未定地退开。", 3),
 b=("查书架编号", 7, "$history gte 280 or $english gte 280",
  "你按古拉丁文编号排出书架顺序，末端的空档后藏着通往暗河渡口的石阶。",
  "编号被火烤得卷曲，你拼不出完整的排序。", 3),
 money=(0, 0),
)

S["abbey_ferry"] = dict(
 short="暗河渡口",
 obs=("看水面暗流", 3, "investigateicon", "$swimmingskill gte 260 or $athletics gte 260",
  "你盯着水面看了一会儿，发现石桩下游有一道回水湾，水底隐约露出一只铅盒的边角。",
  "幽黑河水把倒影搅成一片，你只看见自己的脸在波纹里碎开。"),
 nxt=None, ret=("沿渡口石阶退回修道院口", 4),
 a=("捞水下暗龛", 12, 360,
  "你顶着暗流捞起防水铅盒，里面封着古教团印章和半页深渊羊皮残片；盒底压着约 £4 的渡船买路银币。",
  "你从回水湾鹅卵石缝里摸出两枚沉底旧港银币和一小截刻着渡口编号的铜链。",
  "湍急暗流猛地拽偏手臂，冰冷河水冻得手指痉挛，小臂也在石桩青苔上擦破了皮。", 3),
 b=("查看船头风灯", 6, "$swimmingskill gte 240 or $housekeeping gte 240",
  "你拨亮牛角风灯，在灯座下找到一张渡船排班纸，背面画着水下暗龛的位置。",
  "灯芯受潮，你擦了几次只冒出呛人的黑烟。", 2),
 money=(400, 0),
)

S["glasshouse_orchid"] = dict(
 short="雾化兰花厅",
 obs=("看兰花气根", 3, "tendingicon", "$tending gte 260 or $science gte 260",
  "你发现靠东墙的银脉兰气根都朝同一条磨砂玻璃缝伸展，缝后隐约有标本瓶的幽蓝反光。",
  "甜香熏得人发困，你只看见一片晃动的气根，没辨出风向。"),
 nxt=("穿花架去标本廊", 7), ret=("沿花径退回温室口", 4),
 a=("拨花坛暗格", 10, 320,
  "你拨开石英砂取出密封锦盒：一只古董玉瓶、一朵双生银丝花标本和一枚沙龙赏金银币。",
  "你在花神像倾斜的底座下摸出两枚宾客遗落的银币和一张写着“标本廊”的铜牌。",
  "花架上的血色猪笼草突然倾倒，粘稠液滴和花刺一起落在手背上。你连忙缩手退开。", 2),
 b=("比对兰花标签", 6, "$tending gte 260 or $science gte 260",
  "你读出一张标签背面的育种编号，和夜光标本廊门牌上的编号只差一位。",
  "标签被水雾泡得发白，你只看清半个拉丁学名。", 2),
 money=(0, 0),
)

S["glasshouse_specimen"] = dict(
 short="夜光标本廊",
 obs=("看标本签号", 3, "investigateicon", "$science gte 280 or $tending gte 260",
  "你发现展柜的罗马数字从六直接跳到八，七号的位置留着一道新擦痕，正对着通往穹顶露台的铁梯。",
  "幽蓝荧光在玻璃上晃成一片，你只看见一排差不多的编号。"),
 nxt=("沿铁梯上穹顶露台", 5), ret=("沿长廊退回温室口", 4),
 a=("挑琥珀夹层", 11, 350,
  "你稳稳托住钟罩，从绒布下取出一枚镶金古昆虫琥珀和一朵银丝花标本；夹层里还有约 £3 的购藏经费。",
  "你在解剖台抽屉的标本签盒里翻出两枚备用银元和一张写着“穹顶茶会”的请柬残页。",
  "玻璃钟罩在底座上滑了一下，保存液挥发出的刺鼻药味呛得眼角泛泪。你连忙把钟罩按回原处。", 2),
 b=("读第七号标签", 6, "$science gte 280 or $history gte 240",
  "你认出七号标签背面有一行铅笔字：“穹顶茶会，风向标座”，字迹和园丁的登记簿一致。",
  "标签上的墨水被酒精晕开，你只读出半个日期。", 2),
 money=(300, 0),
)

S["glasshouse_dome"] = dict(
 short="穹顶露台",
 obs=("看风向标偏角", 3, "investigateicon", "$athletics gte 260 or $tending gte 260",
  "你发现风向标底座的铜轴被磨出一圈亮痕，旁边地砖有一道常被掀开的缝，下面透出地窖的酒气。",
  "高空的风把衣角吹得猎猎作响，你只顾扶栏杆，没细看风向标。"),
 nxt=("沿暗梯下酿造室", 9), ret=("沿旋梯退回温室口", 4),
 a=("拧风向标活扣", 12, 370,
  "底座暗格应声开启，你取出一枚古董望远镜片和一朵花嫁银丝花标本；铜盒夹层里压着一张茶会礼单。",
  "你在藤编茶几托盘暗层下摸出两枚贵客留下的小费银币和一张写着“地窖”的卡片。",
  "旋梯最高一级铁踏板突然打滑，手肘磕在铸铁雕花栏杆上。你只好扶着栏杆退回露台。", 3),
 b=("查茶会礼单", 6, "$housekeeping gte 250 or $history gte 240",
  "你在礼单末页找到一行小字：“酒窖第三桶，地窖暗梯”，旁边还画着风向标的简笔。",
  "茶渍把下半页糊成褐色，你只认出几个宾客姓氏。", 2),
 money=(0, 0),
)

S["glasshouse_cellar"] = dict(
 short="地下酿造室",
 obs=("听酒桶回声", 3, "investigateicon", "$science gte 280 or $housekeeping gte 260",
  "你轻叩第三只橡木桶，回声比旁边几只空了一截；桶底箍上有一道被反复撬动的划痕。",
  "酒气熏得人微醺，你敲了几只桶，只听见一片沉闷的咚咚声。"),
 nxt=None, ret=("沿石阶退回温室口", 4),
 a=("敲橡木桶塞", 14, 400,
  "你抽出桶身暗格里的防水铅筒，取得百年秘酿原液和一朵双生银丝花标本；桶底暗袋里还有约 £5 的酒庄私账银币。",
  "你在实木酒架最底层的铁盒里翻出两枚酒窖管事藏起的银币和一张标着“第三桶”的私账页。",
  "木塞突然崩开，喷出一股辛辣发酵酒气，铜蒸馏器的热水管也烫到手腕。你呛得连连后退。", 3),
 b=("看桶箍年份", 7, "$science gte 280 or $housekeeping gte 260",
  "你发现第三只桶的 1889 年箍圈和其余十二只不是同一批，箍下还塞着一小卷私账纸。",
  "霉斑盖住烙印，你只认出两个模糊的数字。", 2),
 money=(500, 0),
)

S["blackiron_siding"] = dict(
 short="废弃调车场",
 obs=("看道岔磨痕", 3, "investigateicon", "$athletics gte 260 or $physique gte 11500",
  "你看见七号道岔的拉杆上有一层新抹的黄油，油迹一路延伸到防雨棚下的三号装甲货车。",
  "碎石道砟在脚下乱滚，你只顾站稳，没看清哪根拉杆被动过。"),
 nxt=("沿副线去装甲车", 8), ret=("沿铁轨退回货运站口", 4),
 a=("别开扳道暗盒", 10, 330,
  "暗盒铁盖崩开，你取出一枚早期铁路纪念金章和半枚孤儿院账册铜匙；油布包里还有一枚押车银币。",
  "你在缓冲器下方的防水布袋里翻出两枚铁路工人的银币和一张写着“三号车”的油污纸条。",
  "生锈的扳道弹簧突然回弹，沉重铁柄擦着膝盖砸下，虎口震得发麻。你只好空手退开。", 3),
 b=("比对车皮编号", 6, "$maths gte 240 or $science gte 240",
  "你发现脱轨煤车的编号跳过了三号，而棚下那节铆钢板的货车正挂着缺失的号牌。",
  "锈迹把钢印糊住，你只认出两个歪斜的数字。", 2),
 money=(0, 0),
)

S["blackiron_armored"] = dict(
 short="三号装甲车",
 obs=("看枪架暗锁", 3, "investigateicon", "$skulduggery gte 280 or $physique gte 12000",
  "你发现枪架后方的暗锁旁有一道新刮痕，锁孔里还卡着半截电报线；线头指向信号值班室。",
  "车厢里枪油味呛鼻，你只看见一排带锁铁架，没辨出暗锁结构。"),
 nxt=("沿铁梯去信号室", 6), ret=("沿车钩退回货运站口", 4),
 a=("探枪架暗格", 12, 380,
  "锁舌咔哒滑开，你取出贴着铅封的黑市银箱和半枚孤儿院编号铜匙；箱底压着约 £4 的押运现钞。",
  "你在押运员折叠床下的帆布包里摸出两张零钞和一张写着“信号室”的交接单。",
  "枪架上的防盗铁链突然哗啦作响，沉重铁锁砸在手背上。你疼得松手退向车门。", 3),
 b=("查押运交接单", 7, "$maths gte 260 or $history gte 240",
  "你从交接单的复写纸痕迹里读出一组信号室呼号，末尾写着“夜间发报”。",
  "复写纸被汗浸花，你只认出半个呼号。", 2),
 money=(400, 0),
)

S["blackiron_signal"] = dict(
 short="信号值班室",
 obs=("听纸带节奏", 3, "investigateicon", "$science gte 260 or $maths gte 260",
  "你听出电报纸带重复着同一组短码，对照墙上的呼号表，它指向仓库地底的地下装卸台。",
  "继电器咔嗒乱响，你只听见一片没有间隔的噪声。"),
 nxt=("沿滑道下装卸台", 10), ret=("沿铁梯退回货运站口", 4),
 a=("翻机箱夹缝", 10, 360,
  "你避开裸露铜线，从机箱夹缝摸出一卷秘密车次底单、一只古董铁路怀表和半枚账册铜匙；旁边还有一枚值班银币。",
  "你在电报机抽屉底层锡盒里找到两枚值班员银币和一张写着“三号仓库滑道”的纸带。",
  "改锥碰到电报机蓄电铜片，一串电火花麻得指尖剧痛。你立刻甩手后退。", 3),
 b=("梳理拉杆编号", 7, "$maths gte 260 or $science gte 260",
  "你把十六根联锁拉杆的编号排开，发现第 12 与 13 号之间多出一组不在图上的道岔，正通地下月台。",
  "编号牌被煤灰盖住，你排到一半便乱了顺序。", 2),
 money=(0, 0),
)

S["blackiron_platform"] = dict(
 short="地下装卸台",
 obs=("看滑轮配重", 3, "investigateicon", "$skulduggery gte 300 or $athletics gte 280",
  "你发现配重铁箱的销轴上有一道新鲜黄油，箱盖边角还沾着樟木屑；旁边的水闸门半开着。",
  "潮湿月台的回声把铁链声放大，你只看见滑轮在暗处轻轻晃。"),
 nxt=None, ret=("沿滑道退回货运站口", 4),
 a=("撬配重铁箱", 14, 410,
  "你稳住滑轮铁索掀开箱盖，取出未拆封的古董货包和半枚孤儿院账册密匙；夹层里还有约 £5 的走私分红。",
  "你在樟木货箱底部的防潮袋里摸出两枚暗市银元和一张写着“账册在城里”的油纸。",
  "起重滑轮铁链猛地滑脱一寸，配重铁箱重重磕在石台上，夹伤手指。你忍痛退到立柱后。", 3),
 b=("听水闸铜钟", 7, "$athletics gte 280 or $swimmingskill gte 240",
  "你数准暗浪撞钟的间隔，在两次钟声之间摸到水闸后一处干燥石台，台上放着一枚铜扣。",
  "冷水漫过鞋面，你被钟声震得心慌，没能找到落脚处。", 3),
 money=(500, 0),
)

S["druid_pillars"] = dict(
 short="迷雾石柱群",
 obs=("看石柱影线", 3, "investigateicon", "$history gte 260 or $tending gte 260",
  "你发现正午影线落在两根挂槲寄生的石柱之间，影尖所指的浅草下有一条被踩实的引水小径。",
  "林雾把石柱的影子揉成一团，你看了半天也定不准方向。"),
 nxt=("沿水径去月泉", 5), ret=("沿兽径退回石环口", 4),
 a=("抠符文凹槽", 10, 330,
  "你拨开卡住的石楔，取出一枚古德鲁伊青铜圣徽和一朵银丝花标本；凹槽深处还有一枚奉纳古银币。",
  "你在槲寄生麻绳系着的小皮囊里翻出两枚祈愿银币和一片刻着月相的石片。",
  "石柱顶端的渡鸦旧巢受惊散落枯枝，粗糙花岗岩棱角刮破手指。你缩回手退下石台。", 2),
 b=("读冬至刻痕", 6, "$history gte 260 or $tending gte 260",
  "你顺着冬至刻痕往下读，发现一组月相标记指向正北的月泉祭坛。",
  "苔藓盖住大半刻痕，你只认出两个重复的月相符号。", 2),
 money=(0, 0),
)

S["druid_moonwell"] = dict(
 short="月泉祭坛",
 obs=("看泉眼水纹", 3, "investigateicon", "$tending gte 280 or $purity gte 500",
  "你发现泉眼有一缕细流绕过白石池沿，渗向东南那棵古橡树的根须；树根下有一道被水冲亮的缝。",
  "冷雾贴着水面走，你只看见月牙池里自己的倒影。"),
 nxt=("沿细流去古根穴", 8), ret=("沿石径退回石环口", 4),
 a=("摸泉眼石缝", 10, 350,
  "你从泉眼石缝里捞出一只密封银匣，里面盛着月华玉佩和一朵双生银丝花标本；池底白砂间还有约 £3 的奉纳银币。",
  "你在出水口白石槽下摸出两枚被泉水冲亮的古银币和一片刻着橡树叶的铜片。",
  "刺骨冷泉冻得五指发僵，脚下青苔一滑，险些栽进池中，手肘也磕在池沿。你只得退开。", 2),
 b=("查三足爵铭文", 6, "$history gte 260 or $purity gte 450",
  "你读出青铜爵腹部的奠酒短句，末尾提到“橡根之下，避雾之所”。",
  "铜锈把铭文咬得只剩几道浅痕，你读不成句。", 2),
 money=(300, 0),
)

S["druid_rootcave"] = dict(
 short="古根地穴",
 obs=("闻陶瓮药香", 3, "tendingicon", "$tending gte 280 or $science gte 260",
  "你辨出五只陶瓮里混着安神草和松脂，最里侧瓮底压着一小截藤梯绳头，绳头通向林冠瞭望台。",
  "苦草药味太浓，你只闻出其中两味，没找到绳头。"),
 nxt=("沿藤梯上瞭望台", 7), ret=("沿根缝退回石环口", 4),
 a=("移石臼底板", 12, 370,
  "你挪开石臼底座，从树根暗穴取出一尊青铜祭祀爵和一朵银丝花标本；鹿皮包里还有约 £4 的古银币。",
  "你在青铜圆盾后方的暗渠口摸出两枚守林人银元和一张画着树冠平台的小皮图。",
  "盘结树根下窜出几只受惊林鼠，石臼边缘磕伤指节。你连忙撒手退回萤石灯下。", 3),
 b=("辨五瓮泥封", 7, "$tending gte 280 or $science gte 260",
  "你发现第三只瓮的泥封上压着一枚藤梯纹，和瞭望台木柱的刻痕一致。",
  "泥封被潮气泡软，你只认出半个指印。", 2),
 money=(400, 0),
)

S["druid_watchtower"] = dict(
 short="林冠瞭望台",
 obs=("看鸽笼方向", 3, "investigateicon", "$athletics gte 280 or $tending gte 260",
  "你看见信鸽总朝西南一片林隙盘旋，那里有一缕极细的炊烟；笼底还卡着一小截磨断的皮绳。",
  "山风把鸽笼吹得乱晃，你只看见灰鸽扑腾，没辨出它们的方向。"),
 nxt=None, ret=("沿藤梯退回石环口", 4),
 a=("旋空心木柱", 11, 360,
  "木柱暗盖旋开，你取出一卷深林秘道图、一只古董银鹰哨和一朵银丝花标本；筒底压着一枚巡林银币。",
  "你在中层值班室柴火堆后的饼干盒里翻出两枚备用银币和一张标着“西南林隙”的草图。",
  "劲风吹晃树冠，木柱上的倒刺扎进掌心，信鸽笼里的灰鸽扑腾乱叫。你连忙缩手扶稳栏杆。", 3),
 b=("用望远镜扫林线", 6, "$athletics gte 280 or $science gte 240",
  "你从镜筒里扫到西南林隙有一处新踩出的岔路，路旁插着一根系白布的木桩。",
  "镜片起了雾，你擦了几次仍看不清远处。", 2),
 money=(0, 0),
)

S["velvet_masque"] = dict(
 short="假面回廊",
 obs=("看面具眼孔", 3, "investigateicon", "$danceskill gte 260 or $seductionskill gte 260",
  "你发现银狐假面右侧眼孔有一圈新磨出的亮痕，壁龛后的丝绒帘比别处薄，透出试衣镜的反光。",
  "壁灯把十二副假面照得一模一样，你只看见一片空洞的眼眶。"),
 nxt=("掀丝绒帘去沙龙", 6), ret=("沿回廊退回天鹅绒口", 4),
 a=("探银狐壁龛", 9, 330,
  "你拨开弹簧卡扣，摸出一枚暗金假面徽章和一枚古董胸针；衬垫下还压着一枚金镑筹码。",
  "你在香槟推车冰桶底下的信封里摸出两枚散碎筹码和一张写着“试衣沙龙”的卡片。",
  "壁龛上的银狐假面突然滑落，金属边缘划伤手背，脆响引得走廊尽头传来脚步声。你连忙空手退开。", 2),
 b=("问侍者香槟年份", 6, "$seductionskill gte 260 or $beauty gte 3500",
  "侍者顺着你的话头提到东侧屏风后的镜面试衣沙龙，还压低声音说今晚有人在那里试衣。",
  "侍者礼貌地报了个年份便端盘走开，没接你的话。", 1),
 money=(0, 0),
)

S["velvet_salon"] = dict(
 short="试衣沙龙",
 obs=("看镜面角度", 3, "investigateicon", "$beauty gte 3500 or $danceskill gte 260",
  "你借斜角铜镜看见西侧纱帘后有一道通往露台的门，门边地毯被反复踩出一道浅痕。",
  "重重镜面映出无数道身影，你看得有些分不清方向。"),
 nxt=("穿纱帘去观海雅座", 7), ret=("沿镜廊退回天鹅绒口", 4),
 a=("摸试衣台底", 11, 360,
  "暗抽屉无声滑开，你取出一匣名贵珍珠饰品和一枚暗金假面徽章；首饰盒底层还有约 £3 的制衣定金。",
  "你在三折屏风后的红珊瑚手包夹层里找出两枚金镑硬币和一张写着“露台雅座”的请柬。",
  "裁缝人台腰封上的珠针扎破指尖，旋转台底座也发出一声闷响。你连忙缩手站起。", 2),
 b=("查衣架尺码牌", 6, "$housekeeping gte 250 or $beauty gte 3500",
  "你在一件披风的尺码牌后找到一张露台邀请卡，卡角印着观海雅座的藤椅纹样。",
  "香水味太冲，你翻了几个衣架便觉得头晕。", 2),
 money=(300, 0),
)

S["velvet_terrace"] = dict(
 short="观海雅座",
 obs=("听峭壁风声", 3, "investigateicon", "$willpower gte 450 or $athletics gte 260",
  "你从风声里辨出一段被压低的谈话：拍卖暗厅的环形阶梯就在火盆后方的铜门里。",
  "峭壁下的黑浪拍得人眼晕，你只听见一片呼啸。"),
 nxt=("沿铜门去拍卖厅", 9), ret=("沿露台退回天鹅绒口", 4),
 a=("旋栏杆柱头", 12, 380,
  "空心柱头旋下，你取出一份封存的名流密信和一枚暗金假面徽章；柱槽底部还塞着一枚私密礼金银币。",
  "你在大理石花盆底下的防水银烟盒里翻出两枚零钞和一张写着“环形阶梯”的卡片。",
  "冰凉的大理石柱头猛地卡死，火盆里飞出的银炭火星烫到手腕。你连忙缩手退回软垫边。", 3),
 b=("看火盆灰烬", 6, "$history gte 240 or $housekeeping gte 250",
  "你从灰烬里拨出半张没烧尽的拍卖目录，背面画着从露台通往暗厅的阶梯。",
  "灰烬迷了眼，你只翻出几片焦黑的纸角。", 2),
 money=(0, 0),
)

S["velvet_auction"] = dict(
 short="拍卖暗厅",
 obs=("看传菜暗梯", 3, "investigateicon", "$skulduggery gte 300 or $history gte 280",
  "你发现展台下方的传菜暗梯口有一道新擦痕，旁边的铜铃线被一根头发丝缠住，显然有人常从这里上下。",
  "环形暗厅静得能听见呼吸，你只看见罩布在空调风里轻轻起伏。"),
 nxt=None, ret=("沿环形梯退回天鹅绒口", 4),
 a=("掀展台罩布", 14, 430,
  "铜簧轻响弹开，你取出一件未交割的传世古物和一枚暗金假面徽章；红木匣里还码着约 £5 的高额筹码。",
  "你在后台记账桌的象牙算盘下摸出两枚保证金银币和一张写着买家缩写的底价单。",
  "展台下的配重铜铃突然被碰响，后台走廊传来执事询问的脚步声。你慌忙放下罩布退入暗影。", 2),
 b=("翻后台记账桌", 7, "$maths gte 240 or $history gte 240",
  "你在账册夹页里找到一个买家的缩写和一枚火漆印，印面和壁龛里的假面徽章一模一样。",
  "算盘珠散了一地，你只顾去捡，没看清账页上的字。", 2),
 money=(500, 0),
)

S["observatory_dome"] = dict(
 short="折光穹顶室",
 obs=("看赤道仪配重", 3, "investigateicon", "$science gte 280 or $maths gte 280",
  "你发现配重铁匣比旁边的黄铜砝码轻了一截，匣底滑轨上有一道常被拉开的亮痕，正对着星图档案室。",
  "巨大的黄铜望远镜投下阴影，你只看见配重匣在暗处一动不动。"),
 nxt=("沿回廊去星图室", 8), ret=("沿木梯退回翼楼口", 4),
 a=("拨配重匣锁扣", 10, 330,
  "你顺利打开配重匣，取出一枚消色差古透镜和半枚王冠黄铜齿轮；铜版星图下还压着一张社团经费单。",
  "你在环形步道小铁桌的火漆盒下摸出两枚学长遗落的银币和一张写着“1894 号筒”的纸条。",
  "地面旋转滑轨里的铜配件卡住鞋底，膝盖磕在赤道仪铁架上。你疼得倒吸一口凉气。", 2),
 b=("读观测记录簿", 6, "$science gte 280 or $maths gte 280",
  "你翻到一页夜间观测记录，末行写着“1894 号筒已移入星图室”，旁边画着一个小箭头。",
  "记录簿被天窗漏下的水汽泡皱，你只认出几个日期。", 2),
 money=(0, 0),
)

S["observatory_star"] = dict(
 short="星图档案室",
 obs=("看画筒编号", 3, "investigateicon", "$history gte 280 or $maths gte 260",
  "你发现画筒架在 1893 与 1895 之间空出一格，空档后方的墙板上有一道新擦痕，通向标本陈列阁。",
  "成百上千只铜管在暗处泛着同样的光，你看得眼花。"),
 nxt=("穿侧门去陈列阁", 7), ret=("沿木廊退回翼楼口", 4),
 a=("拧画筒封盖", 12, 360,
  "封盖顺畅旋开，你倒出一卷孤儿院早年星象密档和半枚王冠齿轮残片；筒底绒布包里还有约 £3 的档案保管金。",
  "你在地球仪支架下的皮面笔记本夹层里翻出两枚旧书券和一张标着“陈列阁”的索书条。",
  "画筒封盖锈得极死，上方架子一只空铜筒滚落下来砸在额角。你捂着额头退下踏脚凳。", 3),
 b=("查月相蚀变图", 6, "$history gte 280 or $maths gte 260",
  "你从月相蚀变图的边缘读出一组日期，和标本陈列阁门牌上的收藏年份完全吻合。",
  "图纸受潮起皱，你算到一半便对不上刻度。", 2),
 money=(300, 0),
)

S["observatory_cabinet"] = dict(
 short="标本陈列阁",
 obs=("看底座合页", 3, "investigateicon", "$science gte 280 or $history gte 260",
  "你注意到紫水晶簇的木底座有一道合页缝，旁边地面有一串从钟楼连廊方向来的新鲜鞋印。",
  "萤石绿光把展柜照得冷幽幽的，你只看见一片晶簇的反光。"),
 nxt=("沿侧廊去钟塔连廊", 4), ret=("沿暗阁退回翼楼口", 4),
 a=("拨水晶底座", 11, 370,
  "底座暗格弹开，你翻出一枚旧港走私王火漆印戒、一块古矿石标本和半枚王冠齿轮残片；里面还垫着一枚收藏金币。",
  "你在旋转玻璃架的海螺化石螺口里摸出两枚绒布包裹的旧银币和一张写着“钟楼连廊”的标签。",
  "锋利的水晶棱角划破指腹，镊子也在玻璃柜壁上磕出脆响。你连忙缩手合上柜门。", 2),
 b=("查化石石板铭牌", 6, "$science gte 280 or $history gte 260",
  "你读出一块化石石板的捐赠铭牌，末尾提到“钟楼连廊风速计”，字迹和展柜标签同源。",
  "铭牌被地衣糊住，你只认出半个姓氏。", 2),
 money=(400, 0),
)

S["observatory_bridge"] = dict(
 short="钟楼连廊",
 obs=("看风速计轴承", 3, "investigateicon", "$athletics gte 260 or $science gte 240",
  "你发现风速计轴承上油过多，旁边石兽背部有一道被反复摸过的浅槽，槽里卡着一小片铁皮。",
  "高处风声呼啸，你只顾扶稳石栏，没细看风速计。"),
 nxt=None, ret=("沿石阶退回翼楼口", 4),
 a=("探石兽凹槽", 11, 350,
  "你勾出卡在石兽凹槽里的铁皮盒，取得半枚王冠黄铜齿轮和一只古董怀表；盒底还压着一枚钟楼修缮银币。",
  "你在风速计底座下的小皮匣里摸出两枚高年级学生藏起的银币和一张写着“连廊检修”的工单。",
  "风速计旋转铜杯刮到手背，拱窗外寒风又吹得你重心不稳。你急忙缩回身子扶住石柱。", 2),
 b=("读修缮铭牌", 6, "$history gte 240 or $maths gte 240",
  "你在连廊石柱上找到一块修缮铭牌，背面记着钟楼报时和一段“西侧石兽”的检修备注。",
  "铭牌字迹被风雨蚀平，你只认出年份。", 2),
 money=(0, 0),
)

HUB_INV = {
 "foghorn_pier": "蹲下细查暗槽",
 "foghorn_keeper": "细查壁炉砖缝",
 "foghorn_wreck": "钻进船长室残骸",
 "foghorn_echo": "循声探查气孔",
 "clockwork_corridor": "俯身查看检修槽",
 "clockwork_steam": "靠近备用冷凝管",
 "clockwork_astro": "检查浑天仪底座",
 "clockwork_vault": "细看十二号卷宗柜",
 "abbey_steps": "俯身查看石兽",
 "abbey_confess": "闪进第三间告解室",
 "abbey_scriptorium": "走近青铜抄经台",
 "abbey_ferry": "蹲到系船石桩边",
 "glasshouse_orchid": "蹲看花坛排水格",
 "glasshouse_specimen": "凑近第七号展柜",
 "glasshouse_dome": "攀上旋梯顶端",
 "glasshouse_cellar": "走到第三只酒桶前",
 "blackiron_siding": "蹲到七号扳道器旁",
 "blackiron_armored": "凑近车内铁枪架",
 "blackiron_signal": "蹲到联锁机箱前",
 "blackiron_platform": "绕到起重滑轮后",
 "druid_pillars": "垫脚够主石柱",
 "druid_moonwell": "跪到月泉池沿",
 "druid_rootcave": "蹲到药草石臼前",
 "druid_watchtower": "握住望远镜底座",
 "velvet_masque": "走近银狐壁龛",
 "velvet_salon": "蹲到试衣台边",
 "velvet_terrace": "扶住汉白玉栏杆",
 "velvet_auction": "走上紫檀展台",
 "observatory_dome": "走到赤道仪北侧",
 "observatory_star": "踩上木踏脚凳",
 "observatory_cabinet": "蹲到最底层展柜",
 "observatory_bridge": "探身靠近石兽",
}

# ---------------- renderers ----------------

def extract_hub_parts(body, key):
    lines = body.splitlines()
    idx = None
    for i, l in enumerate(lines):
        if ('$mpKnown["%s"]' % key) in l:
            idx = i
    if idx is None:
        raise RuntimeError("no self key for " + key)
    open_lines, diff = [], ""
    for l in lines[idx+1:]:
        s = l.strip()
        if s.startswith("<<if"):
            diff = s
            break
        if s:
            open_lines.append(s)
    if not open_lines or not diff:
        raise RuntimeError("cannot extract hub parts for " + key)
    return " ".join(open_lines), diff


def extract_search_intro(body):
    lines = body.splitlines()
    idx = None
    for i, l in enumerate(lines):
        if "<<set $mpKnown to" in l:
            idx = i
    if idx is None:
        raise RuntimeError("no mpKnown line in search")
    intro = []
    for l in lines[idx+1:]:
        s = l.strip()
        if s.startswith("<<set $skulduggerydifficulty"):
            break
        if s:
            intro.append(s)
    if not intro:
        raise RuntimeError("no search intro")
    return " ".join(intro)


def render_hub(key, open_text, diff_line, outside, location):
    d = S[key]
    name = SUB_NAME[key]
    search = name + " Search"
    region = REGION_OF[key]
    order = ORDER[region]
    i = order.index(key)
    next_key = order[i+1] if i + 1 < len(order) else None
    entry = ENTRY[region]
    inv_label, inv_time = HUB_INV[key], d["a"][1]
    obs_label, obs_time, obs_icon, obs_cond, obs_ok, obs_bad = d["obs"]
    nxt_label, nxt_time = d["nxt"] if d["nxt"] else ("", 0)
    ret_label, ret_time = d["ret"]
    oid = "obs-" + key.replace("_", "-")
    out = []
    out.append('<<set $outside to %d>><<set $location to "%s">><<effects>>' % (outside, location))
    out.append('<<set $mpKnown to ($mpKnown or {})>><<set $mpKnown["%s"] to 1>>' % key)
    out.append(open_text)
    out.append(diff_line)
    out.append("<br><br>")
    if next_key:
        out.append('<<if $mpKnown["%s"]>>' % next_key)
        out.append('\t<<walkicon>><<link [[%s (0:%02d)|%s]]>><<pass %d>><</link>>' % (nxt_label, nxt_time, SUB_NAME[next_key], nxt_time))
        out.append("\t<br>")
        out.append("<</if>>")
    out.append('<<getouticon>><<link [[%s (0:%02d)|%s]]>><<pass %d>><</link>>' % (ret_label, ret_time, entry, ret_time))
    out.append("<br>")
    out.append('<<investigateicon>><<link [[%s (0:%02d)|%s]]>><<pass %d>><</link>>' % (inv_label, inv_time, search, inv_time))
    out.append("<br>")
    out.append('<<%s>><<link "%s (0:%02d)">><<pass %d>><<replace "#%s">>' % (obs_icon, obs_label, obs_time, obs_time, oid))
    out.append('<<if %s>>' % obs_cond)
    out.append(obs_ok)
    if next_key:
        out.append('<<set $mpKnown["%s"] to 1>>' % next_key)
    out.append("<<else>>")
    out.append(obs_bad)
    out.append('<<tiredness 1>><<stress 2>>')
    out.append("<</if>>")
    out.append("<</replace>><</link>>")
    out.append("<br>")
    out.append('<div id="%s"></div>' % oid)
    return "\n".join(out)


def render_search(key, intro, outside, location):
    d = S[key]
    name = SUB_NAME[key]
    region = REGION_OF[key]
    order = ORDER[region]
    i = order.index(key)
    next_key = order[i+1] if i + 1 < len(order) else None
    frag = FRAG[region]
    unique_id = "region_unique_" + name.replace(" ", "_")
    cid = key.replace("_", "-") + "-choices"
    a_label, a_time, a_diff, a_ok_u, a_ok_b, a_fail, a_pain = d["a"]
    b_label, b_time, b_cond, b_ok, b_fail, b_tired = d["b"]
    m_u, m_b = d["money"]
    out = []
    out.append('<<set $outside to %d>><<set $location to "%s">><<effects>>' % (outside, location))
    out.append('<<set $mpKnown to ($mpKnown or {})>>')
    out.append(intro)
    out.append("<br><br>")
    out.append('<<walkicon>><<link [[返回%s (0:02)|%s]]>><<pass 2>><</link>>' % (d["short"], name))
    out.append("<br>")
    out.append('<div id="%s">' % cid)
    out.append('<<investigateicon>><<link "%s (0:%02d)">><<pass %d>><<replace "#%s">>' % (a_label, a_time, a_time, cid))
    out.append('<<set $skulduggerydifficulty to %d>><<skulduggerycheck "silent">>' % a_diff)
    out.append("<<if $skulduggerysuccess is 1>>")
    if next_key:
        out.append('\t<<set $mpKnown["%s"] to 1>>' % next_key)
    out.append('\t<<if currentSkillValue("skulduggery") gte 600 and window.dolmp && window.dolmp.claimUniqueReward && window.dolmp.claimUniqueReward("%s")>>' % unique_id)
    out.append("\t\t" + a_ok_u)
    out.append("\t\t<<set $mpAntiquesUnappraised to ($mpAntiquesUnappraised or 0) + 1>>")
    out.append("\t\t<<if ($%s or 0) lt 3>><<set $%s to ($%s or 0) + 1>><</if>>" % (frag, frag, frag))
    if m_u:
        out.append("\t\t<<money %d>>" % m_u)
    out.append("\t\t<<stress -3>>")
    out.append("\t<<else>>")
    out.append("\t\t" + a_ok_b)
    if m_b:
        out.append("\t\t<<money %d>>" % m_b)
    out.append("\t\t<<stress -2>>")
    out.append("\t<</if>>")
    out.append("<<else>>")
    out.append("\t" + a_fail)
    out.append("\t<<stress 5>><<pain %d>>" % a_pain)
    out.append("<</if>>")
    out.append("<</replace>><</link>>")
    out.append("<br>")
    out.append('<<socialiseicon>><<link "%s (0:%02d)">><<pass %d>><<replace "#%s">>' % (b_label, b_time, b_time, cid))
    out.append('<<if %s>>' % b_cond)
    if next_key:
        out.append('\t<<set $mpKnown["%s"] to 1>>' % next_key)
    out.append("\t" + b_ok)
    out.append("\t<<stress -1>>")
    out.append("<<else>>")
    out.append("\t" + b_fail)
    out.append("\t<<tiredness %d>><<stress 3>>" % b_tired)
    out.append("<</if>>")
    out.append("<</replace>><</link>>")
    out.append("</div>")
    return "\n".join(out)

# ---------------- main ----------------

text = open(PATH, encoding="utf-8").read()
parts = re.split(r"(?m)^(?=:: )", text)
header_prefix = parts[0] if parts and not parts[0].startswith(":: ") else ""
if not parts or parts[0].startswith(":: "):
    raise RuntimeError("unexpected split")

new_parts = []
targets = set()
for key in S:
    targets.add(SUB_NAME[key])
    targets.add(SUB_NAME[key] + " Search")
seen = set()
for part in parts:
    if not part.startswith(":: "):
        new_parts.append(part)
        continue
    first_nl = part.find("\n")
    head = part[:first_nl] if first_nl >= 0 else part
    body = part[first_nl+1:] if first_nl >= 0 else ""
    m = re.match(r":: (.+?)(?: \[[^\]]*\])?$", head)
    if not m:
        raise RuntimeError("bad header: " + head)
    name = m.group(1).strip()
    if name in targets:
        outside_m = re.search(r"<<set \$outside to (\d)>>", body)
        loc_m = re.search(r'<<set \$location to "([^"]+)"', body)
        if not outside_m or not loc_m:
            raise RuntimeError("no outside/location in " + name)
        outside = int(outside_m.group(1))
        location = loc_m.group(1)
        if name.endswith(" Search"):
            key = name[:-7]
            if key not in S:
                # key includes passage prefix? derive from SUB_NAME inverse
                inv = {v + " Search": k for k, v in SUB_NAME.items()}
                key = inv[name]
            intro = extract_search_intro(body)
            newbody = render_search(key, intro, outside, location)
        else:
            inv = {v: k for k, v in SUB_NAME.items()}
            key = inv[name]
            open_text, diff_line = extract_hub_parts(body, key)
            newbody = render_hub(key, open_text, diff_line, outside, location)
        new_parts.append(head + "\n" + newbody + "\n\n")
        seen.add(name)
    else:
        new_parts.append(part)

missing = targets - seen
if missing:
    raise RuntimeError("targets not found: " + repr(sorted(missing)))

out_text = "".join(new_parts)
open(PATH, "w", encoding="utf-8", newline="\n").write(out_text)
print("rewrote", len(seen), "passages")
