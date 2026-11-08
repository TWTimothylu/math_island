/* ============ 課程與道具資料 ============ */
const JUNYI_URL = 'https://www.junyiacademy.org/topics/h-m6a-c01';

/* 每座島 = 一個大單元；每個任務 = 均一的小單元 */
const ISLANDS = [
  {
    id: 1, code: '1-1', name: '質數草原', emoji: '🌼', biome: 'meadow',
    tasks: [
      { id: '1a', name: '積木排排站', icon: '🧱', bld: 'house', junyi: ['【觀念】什麼是質數？', '【觀念】什麼是合數？', '【例題】質數的判斷'] },
      { id: '1b', name: '質數泡泡', icon: '🫧', bld: 'dome', junyi: ['【基礎】識別質數 1', '【基礎】識別質數 2'] },
      { id: '1c', name: '三個籃子', icon: '🧺', bld: 'tent', junyi: ['【觀念】1 是質數還是合數？', '【觀念】偶數是質數還是合數？', '【基礎】識別合數', '【基礎】質數與合數'] },
      { id: '1d', name: '質數篩子', icon: '🌀', bld: 'windmill', junyi: ['【觀念】30 之內的質數', '【觀念】判斷質數或合數 1、2'] },
      { id: '1e', name: '是非小精靈', icon: '🧚', bld: 'tower', junyi: ['【進階】關於奇數、偶數、質數、合數的概念問題', '【一般】質數與合數'] },
    ]
  },
  {
    id: 2, code: '1-2', name: '因數森林', emoji: '🌲', biome: 'forest',
    tasks: [
      { id: '2a', name: '質因數獵人', icon: '🏹', bld: 'tent', junyi: ['【觀念】什麼是質因數？', '【例題】練習尋找質因數', '【例題】質因數的衍伸題型'] },
      { id: '2b', name: '長方形花圃', icon: '🌷', bld: 'house', junyi: ['【例題】長方形的排列組合', '【一般】質因數的應用'] },
      { id: '2c', name: '因數大樹', icon: '🌳', bld: 'bigtree', junyi: ['【觀念】什麼是質因數分解？', '【例題】質因數分解的方法 1：樹狀圖', '【例題】質因數分解練習'] },
      { id: '2d', name: '短除法階梯', icon: '🪜', bld: 'tower', junyi: ['【例題】質因數分解的方法 2：短除法', '【基礎】利用短除法做質因數分解', '【一般】質因數分解 1、2'] },
      { id: '2e', name: '因數鍊金台', icon: '⚗️', bld: 'dome', junyi: ['【觀念】利用質因數分解找出一個數所有的因數', '【例題】兩個相乘的數的質因數分解'] },
    ]
  },
  {
    id: 3, code: '1-3', name: '公因數海灣', emoji: '🐚', biome: 'beach',
    tasks: [
      { id: '3a', name: '因數文氏圈', icon: '⭕', bld: 'house', junyi: ['【觀念】什麼是最大公因數？', '【素養動畫】【解題】最大公因數'] },
      { id: '3b', name: '寶石配對', icon: '💎', bld: 'dome', junyi: ['【觀念】利用質因數找出兩個數的最大公因數', '【例題】利用質因數找出兩個數的最大公因數的練習'] },
      { id: '3c', name: '公因數短除塔', icon: '🗼', bld: 'lighthouse', junyi: ['【觀念】利用短除法來找出兩數的最大公因數', '【一般】最大公因數'] },
      { id: '3d', name: '互質小船', icon: '⛵', bld: 'tent', junyi: ['【觀念】什麼是互質？', '【例題】尋找互質的數', '【基礎】認識兩數互質', '【基礎】互質'] },
    ]
  },
  {
    id: 4, code: '1-4', name: '公倍數雪山', emoji: '⛄', biome: 'snow',
    tasks: [
      { id: '4a', name: '青蛙兔子跳跳', icon: '🐸', bld: 'house', junyi: ['【觀念】什麼是最小公倍數？', '【例題】利用最小公倍數找出兩數所有的公倍數'] },
      { id: '4b', name: '寶石合體', icon: '🔮', bld: 'dome', junyi: ['【例題】利用質因數分解來找最小公倍數', '【基礎】最小公倍數'] },
      { id: '4c', name: '公倍數短除塔', icon: '🏔️', bld: 'tower', junyi: ['【例題】利用短除法來尋找最小公倍數', '【基礎】最大公因數和最小公倍數'] },
      { id: '4d', name: '公倍數列車', icon: '🚂', bld: 'tent', junyi: ['【例題】互質的兩個數的最小公倍數', '【例題】利用最小公倍數找出兩數所有的公倍數'] },
    ]
  },
  {
    id: 5, code: '1-5', name: '應用港口', emoji: '⚓', biome: 'autumn',
    tasks: [
      { id: '5a', name: '禮物分裝站', icon: '🎁', bld: 'house', junyi: ['【解題】最大公因數題型 1：分裝兩種不同數量的物品', '【例題】最大公因數題型 4：分裝完還有剩或是不足'] },
      { id: '5b', name: '正方形地磚', icon: '🟩', bld: 'tent', junyi: ['【解題】最大公因數題型 2：大長方形切割成小正方形', '【基礎】最大公因數的應用問題'] },
      { id: '5c', name: '燈塔與公車', icon: '🚌', bld: 'lighthouse', junyi: ['【例題】最小公倍數題型 2：兩人共同出現的時間', '【基礎】最小公倍數的應用問題'] },
      { id: '5d', name: '拼出大正方形', icon: '🧩', bld: 'dome', junyi: ['【例題】最小公倍數題型 3：小長方形拼湊成大正方形'] },
      { id: '5e', name: '港口任務板', icon: '📋', bld: 'tower', junyi: ['【例題】最小公倍數題型 1、4、5：平分剩下／不足一樣的數量', '【例題】最大公因數題型 3：零用錢問題', '【一般】最大公因數和最小公倍數應用問題'] },
    ]
  },
];
const FINAL_TASK = { id: 'final', name: '期末試煉塔', icon: '🏆', bld: 'castle', junyi: ['【後測】翰林六上第一單元'] };
const ALL_TASKS = ISLANDS.flatMap(i => i.tasks.map(t => ({ ...t, island: i.id })));
function taskById(id) { return id === 'final' ? { ...FINAL_TASK, island: 0 } : ALL_TASKS.find(t => t.id === id); }
/* 下一座島解鎖條件：上一座島完成的任務數 */
function unlockNeed(isl) { return Math.max(1, isl.tasks.length - 2); }
const FINAL_NEED = 18;

/* ---------- 外觀道具 ---------- */
const SKINS = ['#ffe3cc', '#f8d0aa', '#eab88f', '#cf9670', '#a46c48', '#6f4732'];
const HAIR_STYLES = [
  { id: 'short', name: '清爽短髮', ico: '🙂', price: 0 },
  { id: 'bob', name: '妹妹頭', ico: '👧', price: 0 },
  { id: 'spiky', name: '刺刺頭', ico: '⚡', price: 0 },
  { id: 'long', name: '長髮', ico: '👩', price: 0 },
  { id: 'pony', name: '馬尾', ico: '🎀', price: 80 },
  { id: 'buns', name: '雙丸子頭', ico: '🍡', price: 80 },
  { id: 'mohawk', name: '龐克頭', ico: '🦔', price: 120 },
  { id: 'afro', name: '爆炸頭', ico: '☁️', price: 120 },
  { id: 'none', name: '光頭', ico: '🥚', price: 0 },
];
const HAIR_COLORS = [
  { c: '#3b2a20', price: 0 }, { c: '#6b4226', price: 0 }, { c: '#1f1f2a', price: 0 }, { c: '#d9a35b', price: 0 },
  { c: '#c0392b', price: 40 }, { c: '#ff8fb1', price: 40 }, { c: '#5bb8f0', price: 40 }, { c: '#7cd6a8', price: 40 },
  { c: '#a78bfa', price: 40 }, { c: '#e8e8f0', price: 60 },
];
const EYES = [
  { id: 'shine', name: '閃亮眼' }, { id: 'dot', name: '豆豆眼' }, { id: 'happy', name: '笑瞇瞇' }, { id: 'sleepy', name: '想睡覺' },
  { id: 'star', name: '星星眼' }, { id: 'wink', name: '眨眨眼' }, { id: 'none', name: '不要（自己畫）' },
];
const MOUTHS = [
  { id: 'smile', name: '微笑' }, { id: 'open', name: '開心大笑' }, { id: 'cat', name: '貓咪嘴' }, { id: 'o', name: '驚訝' },
  { id: 'flat', name: '一字嘴' }, { id: 'tongue', name: '吐舌頭' }, { id: 'none', name: '不要（自己畫）' },
];
const BROWS = [{ id: 'none', name: '沒有' }, { id: 'soft', name: '彎彎眉' }, { id: 'thick', name: '粗眉毛' }, { id: 'angry', name: '認真眉' }];
const OUTFITS = [
  { id: 'tee', name: 'T 恤短褲', ico: '👕', price: 0 },
  { id: 'hoodie', name: '連帽外套', ico: '🧥', price: 0 },
  { id: 'dress', name: '小洋裝', ico: '👗', price: 0 },
  { id: 'overall', name: '吊帶褲', ico: '👖', price: 100 },
  { id: 'sailor', name: '水手服', ico: '⚓', price: 120 },
  { id: 'suit', name: '小西裝', ico: '🤵', price: 150 },
  { id: 'astro', name: '太空裝', ico: '🚀', price: 250 },
];
const CLOTH_COLORS = [
  { c: '#ff8fb1', price: 0 }, { c: '#5bb8f0', price: 0 }, { c: '#7cc95a', price: 0 }, { c: '#ffd34d', price: 0 },
  { c: '#ff8a5b', price: 0 }, { c: '#b197fc', price: 0 }, { c: '#ffffff', price: 0 }, { c: '#3d4a6b', price: 0 },
  { c: '#2ec4b6', price: 50 }, { c: '#e5383b', price: 50 }, { c: '#1b1b2f', price: 70 }, { c: '#ffb703', price: 120 },
];
const PANTS_COLORS = ['#3d5a8a', '#5b4636', '#2f2f3a', '#7c9cbf', '#c9a27a', '#e86a6a'];
const HATS = [
  { id: 'none', name: '不戴', ico: '🚫', price: 0 },
  { id: 'cap', name: '棒球帽', ico: '🧢', price: 0 },
  { id: 'leaf', name: '頭頂小葉', ico: '🌱', price: 60 },
  { id: 'bow', name: '大蝴蝶結', ico: '🎀', price: 60 },
  { id: 'beanie', name: '毛線帽', ico: '🧶', price: 80 },
  { id: 'flower', name: '花圈', ico: '🌸', price: 100 },
  { id: 'headphones', name: '耳機', ico: '🎧', price: 100 },
  { id: 'wizard', name: '魔法帽', ico: '🧙', price: 150 },
  { id: 'crown', name: '小皇冠', ico: '👑', price: 300 },
  { id: 'goldcrown', name: '因數王冠', ico: '🏆', price: -1, note: '通過期末試煉獲得' },
];
const FACE_ACC = [
  { id: 'none', name: '不戴', ico: '🚫', price: 0 },
  { id: 'glasses', name: '圓眼鏡', ico: '👓', price: 60 },
  { id: 'sunglasses', name: '墨鏡', ico: '🕶️', price: 90 },
];
const BACK_ACC = [
  { id: 'none', name: '不背', ico: '🚫', price: 0 },
  { id: 'backpack', name: '小背包', ico: '🎒', price: 80 },
  { id: 'cape', name: '英雄披風', ico: '🦸', price: 180 },
  { id: 'wings', name: '小翅膀', ico: '🪽', price: 200 },
];

const DEFAULT_AVATAR = {
  name: '', skin: SKINS[1], hair: 'short', hairColor: HAIR_COLORS[0].c,
  eyes: 'shine', mouth: 'smile', brows: 'soft', blush: true, faceDraw: '',
  outfit: 'tee', clothColor: CLOTH_COLORS[1].c, pantsColor: PANTS_COLORS[0],
  hat: 'none', face: 'none', back: 'none',
};

/* 道具 key：'hair:pony'、'hc:#ff8fb1'、'outfit:suit'、'hat:crown' ... */
function itemOwned(state, key, price) { return price === 0 || state.owned.includes(key); }
