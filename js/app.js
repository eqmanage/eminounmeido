document.addEventListener('DOMContentLoaded', () => {

  /* ---------------- 状態管理 ---------------- */
  const state = {
    gender: null,
    birthday: null,
    job: '',
    jobMatchedCandidate: null, // true: 提示した候補から選んだ(想定内) / false: その他で自由入力(想定外)
    feeling: null,
    wish: '',
  };

  const screens = {
    landing: document.getElementById('screen-landing'),
    step1: document.getElementById('screen-step1'),
    step2: document.getElementById('screen-step2'),
    step3: document.getElementById('screen-step3'),
    result: document.getElementById('screen-result'),
  };

  function goTo(name) {
    Object.values(screens).forEach((el) => el.classList.remove('is-active'));
    screens[name].classList.add('is-active');
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  document.getElementById('btn-start').addEventListener('click', () => goTo('step1'));
  document.getElementById('btn-back-1').addEventListener('click', () => goTo('step1'));
  document.getElementById('btn-back-2').addEventListener('click', () => goTo('step2'));

  /* ---------------- STEP 1: 性別・誕生日 ---------------- */
  const genderButtons = document.querySelectorAll('#q-gender .choice-pill');
  const birthdayInput = document.getElementById('q-birthday');
  const toStep2Btn = document.getElementById('btn-to-step2');

  // カレンダーにあらかじめ入っているデフォルト日付を、初期状態にも反映しておく
  state.birthday = birthdayInput.value || null;

  function checkStep1() {
    toStep2Btn.disabled = !(state.gender && state.birthday);
  }

  genderButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      genderButtons.forEach((b) => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      state.gender = btn.dataset.value;
      checkStep1();
    });
  });

  birthdayInput.addEventListener('change', () => {
    state.birthday = birthdayInput.value || null;
    checkStep1();
  });

  toStep2Btn.addEventListener('click', () => {
    renderJobChoices();
    goTo('step2');
  });

  /* ---------------- STEP 2: 仕事・気持ち ---------------- */
  const jobChoicesContainer = document.getElementById('q-job-choices');
  const jobOtherInput = document.getElementById('q-job-other');
  const jobLabelEl = document.getElementById('q-job-label');
  const feelingButtons = document.querySelectorAll('#q-feeling .choice-card');
  const toStep3Btn = document.getElementById('btn-to-step3');

  function checkStep2() {
    toStep3Btn.disabled = !(state.job.trim() && state.feeling);
  }

  /* 誕生日から星座を判定し、星座傾向にひもづく職業候補を提示する */
  const zodiacRanges = [
    { name: '山羊座', from: [12, 22], to: [1, 19] },
    { name: '水瓶座', from: [1, 20], to: [2, 18] },
    { name: '魚座', from: [2, 19], to: [3, 20] },
    { name: '牡羊座', from: [3, 21], to: [4, 19] },
    { name: '牡牛座', from: [4, 20], to: [5, 20] },
    { name: '双子座', from: [5, 21], to: [6, 21] },
    { name: '蟹座', from: [6, 22], to: [7, 22] },
    { name: '獅子座', from: [7, 23], to: [8, 22] },
    { name: '乙女座', from: [8, 23], to: [9, 22] },
    { name: '天秤座', from: [9, 23], to: [10, 23] },
    { name: '蠍座', from: [10, 24], to: [11, 22] },
    { name: '射手座', from: [11, 23], to: [12, 21] },
  ];

  function getZodiac(birthdayStr) {
    const d = new Date(birthdayStr);
    if (isNaN(d.getTime())) return null;
    const m = d.getMonth() + 1;
    const day = d.getDate();
    for (const z of zodiacRanges) {
      const [fm, fd] = z.from;
      const [tm, td] = z.to;
      if (fm === tm) {
        if (m === fm && day >= fd && day <= td) return z.name;
      } else if (fm > tm) {
        if ((m === fm && day >= fd) || (m === tm && day <= td)) return z.name;
      } else {
        if ((m === fm && day >= fd) || (m === tm && day <= td) || (m > fm && m < tm)) return z.name;
      }
    }
    return null;
  }

  /* デカン(星座を前期・中期・後期の3つに分割)を判定し、職業候補にさらにバリエーションを持たせる */
  function dayOfYearRef(month, day) {
    // うるう年の影響を避けるため、基準年(2001年)に統一して日数を計算する
    return Math.floor((Date.UTC(2001, month - 1, day) - Date.UTC(2001, 0, 1)) / 86400000);
  }

  function getDecan(birthdayStr) {
    const d = new Date(birthdayStr);
    if (isNaN(d.getTime())) return null;
    const m = d.getMonth() + 1;
    const day = d.getDate();

    for (const z of zodiacRanges) {
      const [fm, fd] = z.from;
      const [tm, td] = z.to;
      const wraps = fm > tm; // 山羊座のように年をまたぐ場合

      const inRange = wraps
        ? ((m === fm && day >= fd) || (m === tm && day <= td))
        : ((m === fm && day >= fd) || (m === tm && day <= td) || (m > fm && m < tm));

      if (!inRange) continue;

      let startDoy = dayOfYearRef(fm, fd);
      let endDoy = dayOfYearRef(tm, td);
      let curDoy = dayOfYearRef(m, day);

      if (wraps) {
        // 年またぎ: 12/22始まり基準で計算し直す(12/22を0とする通算日数に変換)
        const toOffset = (doy) => (doy >= startDoy ? doy - startDoy : doy + 365 - startDoy);
        endDoy = toOffset(endDoy);
        curDoy = toOffset(curDoy);
        startDoy = 0;
      }

      const totalLen = endDoy - startDoy + 1;
      const offset = curDoy - startDoy;
      const third = totalLen / 3;

      if (offset < third) return 1;
      if (offset < third * 2) return 2;
      return 3;
    }
    return null;
  }

  const decanLabel = { 1: '前期', 2: '中期', 3: '後期' };

  const zodiacJobHints = {
    牡羊座: ['消防士', '営業', '自衛官'],
    牡牛座: ['飲食店勤務', '経理・事務', '美容師'],
    双子座: ['営業', '販売・接客', '教師'],
    蟹座: ['保育士', '看護師', '主婦・主夫'],
    獅子座: ['営業', '教師', '警察官'],
    乙女座: ['経理・事務', '看護師', '保育士'],
    天秤座: ['販売・接客', '美容師', '公務員'],
    蠍座: ['警察官', '消防士', 'エンジニア'],
    射手座: ['ドライバー', '自衛官', '営業'],
    山羊座: ['公務員', '経理・事務', 'エンジニア'],
    水瓶座: ['エンジニア', '教師', '公務員'],
    魚座: ['保育士', '看護師', '美容師'],
  };

  /* デカン(前期/中期/後期)ごとに1つ、追加の職業候補を持たせてバリエーションを増やす */
  const zodiacDecanExtra = {
    牡羊座: ['スポーツインストラクター', '起業家', 'イベント企画'],
    牡牛座: ['伝統工芸の職人', '農業関連', 'パティシエ'],
    双子座: ['ライター', '通訳・翻訳', 'ラジオ関連の仕事'],
    蟹座: ['カフェ経営', '福祉関連の仕事', '家庭教師'],
    獅子座: ['舞台・エンタメ関連', '広報・PR', 'イベントプロデューサー'],
    乙女座: ['品質管理の専門職', '編集者', '栄養士'],
    天秤座: ['インテリアコーディネーター', 'ギャラリー運営', '渉外・広報関連'],
    蠍座: ['リサーチャー(調査・分析)', '心理関連の仕事', '醸造・発酵関連'],
    射手座: ['旅行・観光関連', '海外関連の仕事', 'スポーツ関連'],
    山羊座: ['不動産関連', '経営企画', '建築関連の職人'],
    水瓶座: ['NPO運営', 'IT系の新規事業', 'サイエンス関連'],
    魚座: ['アート関連の仕事', 'セラピスト', '写真・映像関連'],
  };

  /* ---------------- 職業の予想エンジン(星座・干支・数秘術・九星気学の複合占い) ---------------- */

  const etoOrder = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  function getEto(year) {
    const idx = ((year - 4) % 12 + 12) % 12;
    return etoOrder[idx];
  }

  const etoJobHints = {
    子: ['営業', '販売・接客'],
    丑: ['経理・事務', '公務員'],
    寅: ['消防士', '自衛官'],
    卯: ['保育士', '美容師'],
    辰: ['エンジニア', '営業'],
    巳: ['警察官', 'エンジニア'],
    午: ['ドライバー', '営業'],
    未: ['保育士', '看護師'],
    申: ['販売・接客', '美容師'],
    酉: ['経理・事務', '公務員'],
    戌: ['警察官', '自衛官'],
    亥: ['消防士', '飲食店勤務'],
  };

  function digitSumReduce(numStr) {
    let n = numStr.split('').reduce((a, c) => a + Number(c), 0);
    while (n > 9) n = String(n).split('').reduce((a, c) => a + Number(c), 0);
    return n;
  }

  function getNumerology(birthdayStr) {
    const digits = birthdayStr.replace(/[^0-9]/g, '');
    const n = digitSumReduce(digits);
    return n === 0 ? 9 : n;
  }

  const numerologyJobHints = {
    1: ['営業', '公務員'],
    2: ['看護師', '保育士'],
    3: ['販売・接客', '美容師'],
    4: ['経理・事務', 'エンジニア'],
    5: ['ドライバー', '営業'],
    6: ['保育士', '看護師'],
    7: ['エンジニア', '警察官'],
    8: ['消防士', '自衛官'],
    9: ['教師', '主婦・主夫'],
  };

  const kyuseiNames = ['一白水星', '二黒土星', '三碧木星', '四緑木星', '五黄土星', '六白金星', '七赤金星', '八白土星', '九紫火星'];
  const kyuseiJobHints = {
    1: ['販売・接客', '営業'],
    2: ['主婦・主夫', '保育士'],
    3: ['営業', 'ドライバー'],
    4: ['教師', '経理・事務'],
    5: ['自衛官', '消防士'],
    6: ['公務員', 'エンジニア'],
    7: ['販売・接客', '美容師'],
    8: ['警察官', '経理・事務'],
    9: ['教師', '看護師'],
  };

  function getKyuseiNumber(birthdayStr) {
    const d = new Date(birthdayStr);
    if (isNaN(d.getTime())) return null;
    let y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    // 節分(2/3〜2/4)より前に生まれた場合は前年の九星気学の年として扱う(簡易的に2/4を境目とする)
    if (m === 1 || (m === 2 && day < 4)) y -= 1;
    const s = digitSumReduce(String(y));
    let starNum = y < 2000 ? 11 - s : 2 - s;
    while (starNum <= 0) starNum += 9;
    while (starNum > 9) starNum -= 9;
    return starNum;
  }

  function getAgeBracket(birthdayStr) {
    const d = new Date(birthdayStr);
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const monthDiff = now.getMonth() - d.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < d.getDate())) age -= 1;
    if (age < 30) return '20代以下';
    if (age < 40) return '30代';
    if (age < 50) return '40代';
    return '50代以上';
  }

  /* 年代・性別のゆるやかな傾向による補正(統計データの引用ではなく、あくまで占いの一要素) */
  function getStatsHint(ageBracket, gender) {
    const table = {
      '20代以下_男性': ['営業', 'ドライバー'],
      '20代以下_女性': ['販売・接客', '保育士'],
      '30代_男性': ['営業', 'エンジニア'],
      '30代_女性': ['販売・接客', '保育士'],
      '40代_男性': ['営業', 'エンジニア'],
      '40代_女性': ['経理・事務', '販売・接客'],
      '50代以上_男性': ['公務員', 'エンジニア'],
      '50代以上_女性': ['主婦・主夫', '看護師'],
    };
    return table[`${ageBracket}_${gender}`] || [];
  }

  function computeJobScores(zodiac, birthdayStr, gender) {
    if (!zodiac || !birthdayStr) return [];
    const year = new Date(birthdayStr).getFullYear();
    const eto = getEto(year);
    const numerology = getNumerology(birthdayStr);
    const kyuseiNum = getKyuseiNumber(birthdayStr);
    const ageBracket = getAgeBracket(birthdayStr);
    const statsHint = getStatsHint(ageBracket, gender);

    const scores = {};
    function addVotes(list, weights) {
      (list || []).forEach((job, i) => {
        scores[job] = (scores[job] || 0) + (weights[i] !== undefined ? weights[i] : 1);
      });
    }

    addVotes(zodiacJobHints[zodiac], [3, 2, 1]);
    addVotes(etoJobHints[eto], [2, 1]);
    addVotes(numerologyJobHints[numerology], [2, 1]);
    addVotes(kyuseiJobHints[kyuseiNum], [2, 1]);
    addVotes(statsHint, [1, 1]);

    return Object.entries(scores).sort((a, b) => b[1] - a[1]);
  }

  function getTopJobCandidates(zodiac, birthdayStr, gender, topN) {
    return computeJobScores(zodiac, birthdayStr, gender).slice(0, topN).map((entry) => entry[0]);
  }

  function renderJobChoices() {
    const zodiac = getZodiac(state.birthday);
    const candidates = getTopJobCandidates(zodiac, state.birthday, state.gender, 3);

    jobLabelEl.textContent = '今のお仕事を教えてください';
    document.getElementById('q-job-hint').textContent = '近いものがあれば選んでください';

    let options = [...candidates];
    options.push('その他(自分で入力する)');
    if (options.length === 1) options = ['その他(自分で入力する)'];

    jobChoicesContainer.innerHTML = options.map((label) => `
      <button type="button" class="choice-card" data-value="${label}">${label}</button>
    `).join('');

    jobOtherInput.style.display = 'none';
    jobOtherInput.value = '';
    state.job = '';
    checkStep2();

    jobChoicesContainer.querySelectorAll('.choice-card').forEach((btn) => {
      btn.addEventListener('click', () => {
        jobChoicesContainer.querySelectorAll('.choice-card').forEach((b) => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');

        if (btn.dataset.value === 'その他(自分で入力する)') {
          jobOtherInput.style.display = '';
          jobOtherInput.focus();
          state.job = jobOtherInput.value.trim();
          state.jobMatchedCandidate = false;
        } else {
          jobOtherInput.style.display = 'none';
          state.job = btn.dataset.value;
          state.jobMatchedCandidate = true;
        }
        checkStep2();
      });
    });
  }

  jobOtherInput.addEventListener('input', () => {
    state.job = jobOtherInput.value;
    state.jobMatchedCandidate = false;
    checkStep2();
  });

  feelingButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      feelingButtons.forEach((b) => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      state.feeling = btn.dataset.value;
      checkStep2();
    });
  });

  toStep3Btn.addEventListener('click', () => {
    renderWishChoices();
    goTo('step3');
  });

  /* ---------------- STEP 3: やってみたい仕事 ---------------- */
  const wishChoicesContainer = document.getElementById('q-wish-choices');
  const wishOtherInput = document.getElementById('q-wish-other');
  const wishLabelEl = document.getElementById('q-wish-label');

  /* 星座からの「気になる分野」候補(現職とは違う、少し夢のある方向性) */
  const zodiacDreamJobs = {
    牡羊座: ['起業家', 'スポーツ関連の仕事', 'ツアーガイド'],
    牡牛座: ['パン職人', '陶芸家', '農業'],
    双子座: ['ライター', 'ラジオパーソナリティ', '通訳・翻訳'],
    蟹座: ['カフェ経営', '子育て支援の仕事', 'ゲストハウス運営'],
    獅子座: ['舞台・エンタメ関連の仕事', '講演家', 'ブランドオーナー'],
    乙女座: ['整理収納アドバイザー', '図書館司書', '品質管理の専門職'],
    天秤座: ['フラワーショップ経営', 'インテリアコーディネーター', 'ギャラリー運営'],
    蠍座: ['リサーチャー', '心理カウンセラー', '醸造家(ワイン・日本酒)'],
    射手座: ['旅行関連の仕事', 'ダイビングインストラクター', '海外関連の仕事'],
    山羊座: ['不動産関連の仕事', '伝統工芸の職人', '経営コンサルタント'],
    水瓶座: ['NPO運営', '新規事業の立ち上げ', 'サイエンスライター'],
    魚座: ['写真家', 'ヨガインストラクター', 'アートセラピスト'],
  };

  /* 今の気持ち(Q4)からの、方向性のヒント */
  const feelingWishHints = {
    continue: '在宅でできる、負担の少ない仕事',
    unrewarded: '成果がきちんと数字で見える仕事',
    repetition: '毎回内容が変わる、プロジェクト型の仕事',
    'other-desire': 'ずっと気になっていた分野の仕事',
    vague: '焦らず探しながら決められる仕事',
  };

  function renderWishChoices() {
    const zodiac = getZodiac(state.birthday);
    const dreamJobs = zodiac ? zodiacDreamJobs[zodiac] : [];
    const feelingHint = feelingWishHints[state.feeling];

    if (zodiac) {
      wishLabelEl.textContent = 'ちょっとやってみたい仕事は、ありますか？';
      document.getElementById('q-wish-hint').textContent = '気になるものがあれば選んでください。近いものがなければ「その他」へ';
    } else {
      wishLabelEl.textContent = 'ちょっとやってみたい仕事は、ありますか？';
      document.getElementById('q-wish-hint').textContent = '思いつかなければ、気になる分野やキーワードだけでも構いません';
    }

    const options = [...dreamJobs];
    if (feelingHint) options.push(feelingHint);
    options.push('その他(自分で入力する)');
    options.push('特にない');

    wishChoicesContainer.innerHTML = options.map((label) => `
      <button type="button" class="choice-card" data-value="${label}">${label}</button>
    `).join('');

    wishOtherInput.style.display = 'none';
    wishOtherInput.value = '';
    state.wish = '';

    wishChoicesContainer.querySelectorAll('.choice-card').forEach((btn) => {
      btn.addEventListener('click', () => {
        wishChoicesContainer.querySelectorAll('.choice-card').forEach((b) => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');

        if (btn.dataset.value === 'その他(自分で入力する)') {
          wishOtherInput.style.display = '';
          wishOtherInput.focus();
          state.wish = wishOtherInput.value.trim();
        } else if (btn.dataset.value === '特にない') {
          wishOtherInput.style.display = 'none';
          state.wish = '';
        } else {
          wishOtherInput.style.display = 'none';
          state.wish = btn.dataset.value;
        }
      });
    });
  }

  wishOtherInput.addEventListener('input', () => { state.wish = wishOtherInput.value; });

  document.getElementById('btn-diagnose').addEventListener('click', () => {
    goTo('result');
    runDiagnosis();
  });

  /* ---------------- 職業の翻訳辞書 ---------------- */
  /* 「これまでの経験の本質」を言語化し、意外性のある新しい道につなげる */
  const occupationDictionary = [
    {
      keywords: ['消防士', '消防', '救急隊', '救急救命士', 'レスキュー'],
      essence: '緊張の中でも心を静め、型を極めてきた集中力',
      peopleFacing: false,
      suggestions: [
        { job: '生け花の先生', reason: '一瞬の判断と、美しい所作を積み重ねてきた修練が、花を通した表現に自然と重なります。', episode: '現場で「型を体に染み込ませるまで繰り返す」姿勢を培ってきたことは、稽古を通じて感覚を磨いていく生け花の世界でも、そのまま強みになります。', tag: 'continue' },
        { job: '防災・危機管理の講師', reason: '現場で培った冷静な判断力を、企業や地域に伝える形で活かせます。', episode: 'とっさの判断を求められる現場に立ち続けてきた経験は、伝える立場になったときに、机上の知識にはない説得力になります。', tag: 'unrewarded' },
              { job: '防災用品の企画・開発者', reason: '現場で本当に必要とされる装備を知っている経験は、商品開発に直結します。', episode: '実際に使う立場で感じてきた「ここが使いにくい」という感覚は、防災用品を企画する仕事でそのまま強みになります。', tag: 'repetition' },
        { job: '登山ガイド・レスキュー系アウトドア指導員', reason: '体力と危機管理能力を、山という現場で活かす道もあります。', episode: 'とっさの判断力と体力を鍛えてきた経験は、登山の現場で人の安全を預かる仕事と、自然に重なります。', tag: 'other-desire' },
        { job: '田舎での自給自足的な暮らしの実践者', reason: '焦らず今の力を活かせる場所を探る時間を持つのも良い選択です。', episode: 'すぐに答えを出さなくても、体を動かしながら次の道をゆっくり探る生き方も、選択肢の一つです。', tag: 'vague' },
        { job: '施設管理・設備保安の仕事', reason: '緊急対応の経験を、建物やインフラの安全管理に活かせます。', episode: '現場で培った危機管理の感覚は、日常的な施設の安全を守る仕事でも、静かに活き続けます。', tag: 'neutral' },
],
      uniqueSuggestion: { job: '落語家', reason: '緊迫した現場で身につけた間合いと度胸は、人前で場を持たせる話芸にも意外なほど通じます。', episode: '一瞬の判断と、張り詰めた空気を和らげてきた経験は、高座で観客の呼吸を読む感覚とどこかで重なります。' },
    },
    {
      keywords: ['警察官', '警察', '刑事', '交番'],
      essence: '初対面の相手を観察し、短い時間で信頼を築く力',
      peopleFacing: true,
      suggestions: [
        { job: '営業職', reason: '人の表情や言葉の裏にある本音を読み取る力は、信頼関係が要となる営業でそのまま活きます。', episode: '初対面の相手の些細な変化に気づいてきた観察眼は、商談の場でも「今、何を求めているか」を読み取る力として活きます。', tag: 'continue' },
        { job: '人材コーディネーター', reason: '人を見極め、適切な場所につなぐという役割は、日々の仕事の延長線上にあります。', episode: '人を見極め、適切な場所に導いてきた経験は、転職支援の現場でもそのまま応用できます。', tag: 'unrewarded' },
              { job: 'セキュリティコンサルタント', reason: 'リスクを先読みする視点を、企業や施設の安全対策に活かせます。', episode: '犯罪の芽を事前に察知してきた視点は、企業の防犯体制を見直す仕事でも、そのまま力を発揮します。', tag: 'repetition' },
        { job: '交通安全の講演家', reason: '現場で見てきた事故の実態を、伝える立場から社会に還元できます。', episode: '取り締まりの現場で得た教訓は、学校や企業向けの講演という形で、多くの人に届けられます。', tag: 'other-desire' },
        { job: '地域の見守り活動コーディネーター', reason: '焦らず、これまでの経験を地域に還元する道を探るのも一つの選択です。', episode: 'すぐに転身先を決めなくても、地域を見守る活動から少しずつ関わりを広げていく道もあります。', tag: 'vague' },
        { job: '施設警備・危機管理担当', reason: '培ってきた危機管理能力を、企業や施設の日常的な安全確保に活かせます。', episode: '現場で鍛えた判断力は、施設全体の安全を預かる仕事でも、そのまま通用します。', tag: 'neutral' },
],
      uniqueSuggestion: { job: '推理小説家・脚本家', reason: '現場で見てきた人間模様の機微を、物語として描く力に転用できます。', episode: '事件の裏にある人の心の動きを見つめてきた経験は、フィクションの中に説得力を宿すための、何よりの土台になります。' },
    },
    {
      keywords: ['看護師', 'ナース', '看護'],
      essence: '人の弱さに寄り添い、支え続ける力',
      peopleFacing: true,
      suggestions: [
        { job: 'キャリアカウンセラー', reason: '相手の状態を見立て、必要な支えを差し出す力は、仕事の悩みに寄り添う場面でも活きます。', episode: '患者さんの状態を見立て、必要な言葉をかけてきた経験は、キャリアに悩む人の話を聞く場面でも活きます。', tag: 'continue' },
        { job: '産業保健スタッフ', reason: '医療の知識と、人に寄り添う姿勢を、企業で働く人たちのために使う道があります。', episode: '医療の知識だけでなく、忙しい人に無理なく寄り添ってきた経験が、働く人の健康管理という仕事に直結します。', tag: 'unrewarded' },
              { job: '終活カウンセラー', reason: '人生の終わりに向き合ってきた経験は、終活を考える人の伴走役になれます。', episode: '命の終わりに寄り添ってきた経験は、これからの人生を整理したい人の背中を押す仕事に、静かに活きます。', tag: 'repetition' },
        { job: '健康経営アドバイザー', reason: '医療知識を、企業の健康経営という予防の視点で活かす道があります。', episode: '病気になった人を見てきた経験は、病気になる前に防ぐ仕組みを企業に提案する仕事でも役立ちます。', tag: 'other-desire' },
        { job: '訪問看護でのゆるやかな働き方', reason: '焦らず、これまでのペースを保ちながら関わり方を変える選択もあります。', episode: '今の働き方をすぐに手放さなくても、訪問看護のような形で関わり方を少しずつ変えていく道もあります。', tag: 'vague' },
        { job: '医療機器メーカーのサポート担当', reason: '医療知識を、現場を離れた形で活かす道もあります。', episode: '臨床の知識は、医療機器の使い方をサポートする仕事でも、確かな信頼につながります。', tag: 'neutral' },
],
      uniqueSuggestion: { job: '遺品整理士', reason: '人生の最期に寄り添ってきた経験は、遺されたご家族の気持ちに寄り添う仕事でも活きます。', episode: '命と向き合う現場で培った静かな眼差しは、故人の暮らしの痕跡と丁寧に向き合う仕事において、かけがえのない力になります。' },
    },
    {
      keywords: ['教師', '教員', '学校の先生'],
      essence: '複雑なことを、相手に合わせてわかりやすく伝える力',
      peopleFacing: true,
      suggestions: [
        { job: '企業研修講師', reason: '教えることのプロとしての経験は、大人向けの研修にもそのまま応用できます。', episode: '同じ内容でも相手のレベルに合わせて説明を変えてきた経験は、社会人研修の現場でそのまま武器になります。', tag: 'continue' },
        { job: 'ライター', reason: '伝わる言葉を選ぶ力は、文章という形に置き換えても発揮できます。', episode: '難しいことをかみ砕いて伝えてきた積み重ねは、文章という形に変えても十分に通用します。', tag: 'unrewarded' },
              { job: 'オンライン講座の講師', reason: '教える技術を、場所を選ばない形で多くの人に届けられます。', episode: '教室というひとつの場所で培ってきた伝え方は、画面の向こうの見えない生徒にも通じる普遍的な技術です。', tag: 'repetition' },
        { job: 'PTA・地域教育コーディネーター', reason: '学校現場を知っているからこそ、家庭と地域をつなぐ役割ができます。', episode: '教育の現場を見てきた経験は、学校の外で子どもたちを支える仕組みづくりにも活かせます。', tag: 'other-desire' },
        { job: '図書館司書・学習支援員', reason: '焦らず、教育に関わり続けながら働き方を変える選択もあります。', episode: 'すぐに大きく舵を切らなくても、学びを支える別の立場から関わり続ける道もあります。', tag: 'vague' },
        { job: '教材制作・出版関連の仕事', reason: '教える経験を、教材という形に残す仕事に活かせます。', episode: '教室で培った「伝わる工夫」は、教材を作る仕事にも、そのまま活きます。', tag: 'neutral' },
],
      uniqueSuggestion: { job: 'キャンプ場運営・野外教育インストラクター', reason: '教える経験を、教室の外、自然の中の学びの場に置き換える道もあります。', episode: '相手のレベルに合わせて伝え方を変えてきた力は、天候も反応も読めない自然の中でこそ、真価を発揮します。' },
    },
    {
      keywords: ['経理', '会計', '総務', '事務'],
      essence: '細部を見落とさず、正確に積み上げていく力',
      peopleFacing: false,
      suggestions: [
        { job: 'ファイナンシャルプランナー', reason: '数字と誠実に向き合ってきた姿勢は、個人のお金の相談に乗る仕事でも信頼につながります。', episode: '数字のズレを見逃さず、こつこつ確認してきた姿勢は、お金の相談に乗る仕事で大きな信頼につながります。', tag: 'continue' },
        { job: '士業事務所のアシスタント', reason: '正確さと粘り強さが求められる仕事との相性が良い傾向にあります。', episode: '正確な処理を積み重ねてきた実績は、専門家のそばで仕事をする際に、そのまま評価されるポイントになります。', tag: 'unrewarded' },
              { job: '補助金・助成金の申請サポート', reason: '書類の正確さと制度理解を、事業者支援という形で活かせます。', episode: '細かい書類仕事を積み重ねてきた経験は、複雑な申請書類を代行する仕事にそのまま直結します。', tag: 'repetition' },
        { job: '家計相談アドバイザー', reason: '数字を扱ってきた誠実さを、個人の家計という身近な相談に活かせます。', episode: '会社のお金と誠実に向き合ってきた姿勢は、家庭のお金の悩みに寄り添う仕事にも通じます。', tag: 'other-desire' },
        { job: '在宅での経理代行', reason: '焦らず、今のスキルを活かしながら働き方だけを変える選択もあります。', episode: '大きく分野を変えなくても、働く場所や時間を変えるだけで、見える景色が変わることがあります。', tag: 'vague' },
        { job: '経理・総務のコンサルタント', reason: '培ってきた実務知識を、他社の仕組みづくりに活かせます。', episode: '自社で積み上げてきた経理の型は、他の会社の仕組みを整える仕事でも、そのまま価値になります。', tag: 'neutral' },
],
      uniqueSuggestion: { job: '骨董品・古物の鑑定士', reason: '数字の細部を見逃さない目は、物の真贋を見極める仕事にも通じます。', episode: '小さな不整合も見逃さず確認し続けてきた姿勢は、真贋を分ける微細な違いを見抜く仕事において、そのまま武器になります。' },
    },
    {
      keywords: ['営業'],
      essence: '人との関係を築き、数字という結果に落とし込む力',
      peopleFacing: true,
      suggestions: [
        { job: '独立系の営業代行・コンサルタント', reason: 'これまで培った関係構築力を、特定の会社ではなく自分の看板で活かす道があります。', episode: '特定の商品を売る力ではなく、人との関係を築く力そのものを、自分の看板で使う道があります。', tag: 'continue' },
        { job: 'カスタマーサクセス', reason: '売ることだけでなく、相手を成功に導く力として応用できます。', episode: '契約を取るまでで終わらせず、その後の関係を大切にしてきた姿勢は、顧客の成功を支える仕事にそのまま向いています。', tag: 'unrewarded' },
              { job: 'クラウドファンディングの企画運営', reason: '人を巻き込み、共感を集める力を、プロジェクト単位で発揮できます。', episode: '商品を売るのではなく想いを伝えてきた経験は、共感を資金に変えるクラウドファンディングの仕事と相性が良いです。', tag: 'repetition' },
        { job: '講演・研修講師', reason: '説得力のある話し方を、営業以外の場でも伝える仕事に活かせます。', episode: '商談で鍛えてきた「伝わる話し方」は、研修やセミナーの講師業でもそのまま武器になります。', tag: 'other-desire' },
        { job: '地域の特産品を紹介する仕事', reason: '焦らず、人と関わる力を活かせる場所を探る時間を持つのも良い選択です。', episode: 'すぐに答えを出さなくても、人と話す力を活かせる別の場所を、少しずつ探ってみる道もあります。', tag: 'vague' },
        { job: '営業研修・OJTトレーナー', reason: '培ってきた営業スキルを、後進の育成という形で活かせます。', episode: '数字を作ってきた経験は、次の世代に営業の型を伝える仕事でも、確かな説得力を持ちます。', tag: 'neutral' },
],
      uniqueSuggestion: { job: '司会業・MC', reason: '人前で場を盛り上げ、相手の反応を見ながら話を組み立てる力は、司会業でも活きます。', episode: '商談の場の空気を読み、間合いを取ってきた経験は、大勢の前で場を回す仕事にも意外なほどなじみます。' },
    },
    {
      keywords: ['販売', '接客', '店員', 'ショップ'],
      essence: '目の前の人の反応を読み、瞬時に対応を変える力',
      peopleFacing: true,
      suggestions: [
        { job: '接客・接遇の講師業', reason: '現場で培った感覚は、言葉にして人に教えるという形でも価値を持ちます。', episode: 'お客様の顔色を見て、対応を変えてきた感覚は、言葉にして人に伝えることでさらに価値を持ちます。', tag: 'continue' },
        { job: 'カスタマーサクセス', reason: 'お客様に寄り添ってきた経験が、契約後の関係づくりに活かせます。', episode: '目の前の一人に向き合ってきた経験は、契約後も長く関わる仕事において強みになります。', tag: 'unrewarded' },
              { job: 'ショップ開業・EC運営', reason: 'お客様目線を知り尽くした経験を、自分の店づくりに活かせます。', episode: '現場で培った「お客様が本当に求めているもの」を見る目は、自分の店を構える時の一番の武器になります。', tag: 'repetition' },
        { job: 'クレーム対応・CS研修の講師', reason: '難しい対応をこなしてきた経験を、他のスタッフに教える立場で活かせます。', episode: '怒っているお客様と向き合ってきた経験は、他の人に「対応のコツ」として伝える仕事に、そのまま活きます。', tag: 'other-desire' },
        { job: '地域の直売所・マルシェ運営', reason: '焦らず、人と接する力を活かせる場所を探る時間を持つのも良い選択です。', episode: '大きく仕事を変えなくても、直売所のような小さな現場から、新しい関わり方を試すこともできます。', tag: 'vague' },
        { job: '店舗運営コンサルタント', reason: '現場で培った接客の視点を、店舗全体の改善提案に活かせます。', episode: 'お客様の反応を見てきた経験は、店舗運営そのものを見直す仕事でも、そのまま活きます。', tag: 'neutral' },
],
      uniqueSuggestion: { job: '旅館の女将・宿の看板役', reason: 'お客様一人ひとりに合わせたおもてなしの感覚を、宿という舞台で発揮する道があります。', episode: '目の前の人の様子を読み、対応を変えてきた感覚は、一晩の滞在に心を尽くすもてなしの仕事と、静かに重なります。' },
    },
    {
      keywords: ['エンジニア', 'SE', 'プログラマ', 'システム', 'IT'],
      essence: '複雑な問題を分解し、順序立てて解決する力',
      peopleFacing: false,
      suggestions: [
        { job: '小さな事業の立ち上げ', reason: '仕組みを設計する力は、自分の事業を組み立てる際の土台になります。', episode: '複雑な要件を整理し、動くものに落とし込んできた経験は、自分の事業を一から組み立てる際の土台になります。', tag: 'continue' },
        { job: '技術顧問・アドバイザー', reason: '積み上げてきた専門知識を、現場を離れた形で伝える道もあります。', episode: '現場で培った知識は、実際に手を動かさなくても、助言という形で十分な価値を持ちます。', tag: 'unrewarded' },
              { job: 'プログラミング講師', reason: '複雑な技術を分かりやすく伝える力を、教育の場で発揮できます。', episode: '難解な仕様をチームに説明してきた経験は、初心者にプログラミングを教える仕事でも活きます。', tag: 'repetition' },
        { job: 'IT導入支援コンサルタント', reason: '現場の課題を技術で解決してきた経験を、中小企業のIT化支援に活かせます。', episode: '技術と現場をつないできた経験は、ITに詳しくない企業の導入支援において、何よりの武器になります。', tag: 'other-desire' },
        { job: '田舎でのリモートエンジニア', reason: '焦らず、働く場所だけを変えてみるという選択もあります。', episode: 'スキルはそのままに、暮らす場所を変えるだけで、働き方の景色が変わることもあります。', tag: 'vague' },
        { job: 'ITヘルプデスク・サポート業務', reason: '技術知識を、困っている人を助ける形で日常的に活かせます。', episode: '複雑な技術を分かりやすく伝えてきた経験は、サポート業務でも変わらず力になります。', tag: 'neutral' },
],
      uniqueSuggestion: { job: '謎解きゲーム・体験型イベントの制作者', reason: '論理的な仕組みを組み立てる力を、遊びの設計に転用する道もあります。', episode: '複雑な仕様を一つずつ組み上げてきた力は、人を楽しませる仕掛けを設計する仕事でも、そのまま活きます。' },
    },
    {
      keywords: ['公務員', '市役所', '区役所', '行政', '役場'],
      essence: '立場の異なる人たちの利害を調整する力',
      peopleFacing: false,
      suggestions: [
        { job: 'NPO・地域団体の運営', reason: '公共のために動いてきた経験は、地域の課題解決の現場でそのまま活きます。', episode: '立場の異なる人たちの意見を聞き、間を取り持ってきた経験は、地域活動の現場でそのまま活きます。', tag: 'continue' },
        { job: '地域コーディネーター', reason: '行政と住民の間に立ってきた経験が、橋渡し役として力を発揮します。', episode: '制度と現場の両方を知っているからこそ、住民と行政の橋渡し役として重宝されます。', tag: 'unrewarded' },
              { job: '防災士・地域防災アドバイザー', reason: '行政の仕組みを知る立場から、地域の防災体制づくりに関われます。', episode: '制度の内側を知ってきた経験は、地域の防災計画を住民目線で見直す仕事に活かせます。', tag: 'repetition' },
        { job: '行政書士等の士業', reason: '行政手続きへの理解を、資格を通じて個人や事業者の支援に活かせます。', episode: '書類と制度を扱ってきた経験は、行政書士として独立する際の、大きなアドバンテージになります。', tag: 'other-desire' },
        { job: '地域おこし協力隊への参加', reason: '焦らず、公共への意識を持ちながら新しい環境を試す選択もあります。', episode: 'すぐに答えを出さなくても、任期付きの活動から新しい関わり方を試してみる道もあります。', tag: 'vague' },
        { job: '許認可申請サポートの専門職', reason: '行政手続きへの理解を、事業者支援という形で活かせます。', episode: '制度を扱ってきた経験は、複雑な申請をサポートする仕事にも、そのまま応用できます。', tag: 'neutral' },
],
      uniqueSuggestion: { job: '古民家再生・空き家活用プロデューサー', reason: '制度と現場をつなぐ調整力を、地域資源の再生に活かす道もあります。', episode: '立場の異なる人たちの間に立ってきた経験は、古い建物と新しい使い手をつなぐ仕事でも、静かに力を発揮します。' },
    },
    {
      keywords: ['飲食', '調理', 'ホール', '料理人', 'シェフ', 'コック'],
      essence: '限られた時間の中で、複数のことを同時にこなす力',
      peopleFacing: true,
      suggestions: [
        { job: '食育インストラクター', reason: '食への知識と経験を、次の世代に伝える形に翻訳できます。', episode: '毎日の調理で培った知識は、伝える相手を変えるだけで、新しい価値になります。', tag: 'continue' },
        { job: '小さな宿・ゲストハウスの運営', reason: 'おもてなしの感覚と現場力を、宿泊という形で発揮する道があります。', episode: '限られた時間で複数のことを回してきた現場力は、宿泊業の忙しい時間帯でもそのまま活きます。', tag: 'unrewarded' },
              { job: '食品ロス削減の企画・コンサルタント', reason: '食材を扱ってきた現場感覚を、社会課題の解決に活かせます。', episode: '食材を無駄にしないための工夫を重ねてきた経験は、食品ロス削減の仕組みづくりにそのまま活きます。', tag: 'repetition' },
        { job: '出張シェフ・ケータリング', reason: '現場で培った調理技術を、自分の看板で届ける働き方ができます。', episode: '厨房で鍛えた技術は、会場を選ばず腕を振るう出張シェフという働き方にも、無理なくつながります。', tag: 'other-desire' },
        { job: '地方の宿や農家での住み込み手伝い', reason: '焦らず、暮らし方ごと変えてみるという選択もあります。', episode: 'すぐに大きな決断をしなくても、環境を変えて働く経験から、次の道が見えてくることがあります。', tag: 'vague' },
        { job: '飲食店の開業コンサルタント', reason: '現場を知り尽くした経験を、これから開業する人の支援に活かせます。', episode: '現場で培った勘所は、新しく店を始める人にとって、何より実践的なアドバイスになります。', tag: 'neutral' },
],
      uniqueSuggestion: { job: '移動販売車(キッチンカー)のオーナー', reason: '限られた環境で回してきた現場力を、自分の看板で発揮する道があります。', episode: '狭い厨房で複数のことを同時にこなしてきた経験は、小さな車の中で店を営む仕事にも、そのまま活きます。' },
    },
    {
      keywords: ['自衛官', '自衛隊'],
      essence: '厳しい環境の中でも、チームを機能させる力',
      peopleFacing: false,
      suggestions: [
        { job: '危機管理コンサルタント', reason: '有事を想定して備える視点は、企業のリスク管理にそのまま応用できます。', episode: '最悪の事態を想定して備えてきた視点は、企業のリスク管理においてそのまま貴重な視点になります。', tag: 'continue' },
        { job: 'アウトドア・野外活動インストラクター', reason: '体力と統率力を、自然の中での指導という形で活かせます。', episode: '体力とチームをまとめる力は、自然の中での指導という場でも発揮できます。', tag: 'unrewarded' },
              { job: '防災・災害派遣の専門アドバイザー', reason: '災害対応の経験を、自治体や企業の防災計画づくりに活かせます。', episode: '実際の災害派遣で得た知見は、机上の計画にはないリアリティを、防災対策に与えられます。', tag: 'repetition' },
        { job: '警備・施設管理のマネージャー', reason: '規律とチーム運営の力を、施設全体の安全管理に活かせます。', episode: '組織で培った統率力は、大規模施設の警備体制を束ねる仕事にも、そのまま応用できます。', tag: 'other-desire' },
        { job: '地方での防災ボランティア活動', reason: '焦らず、培ってきた力を地域に還元する道を探るのも一つの選択です。', episode: 'すぐに転職先を決めなくても、ボランティアという形で経験を活かしながら、次の道を探る選択もあります。', tag: 'vague' },
        { job: '施設の安全管理・防災担当', reason: '培ってきた危機管理の意識を、日常的な施設運営に活かせます。', episode: '有事を想定して備えてきた視点は、平時の安全管理でも、静かに力を発揮します。', tag: 'neutral' },
],
      uniqueSuggestion: { job: '秘境ガイド・探検家', reason: '過酷な環境に適応する力を、未知の場所を案内する仕事に転用できます。', episode: '厳しい環境でチームを機能させてきた経験は、予測できない自然の中で人を導く仕事とも、深いところでつながっています。' },
    },
    {
      keywords: ['保育士', '幼稚園', '保育'],
      essence: '小さな変化に気づき、根気強く向き合う力',
      peopleFacing: true,
      suggestions: [
        { job: '企業内保育・子育て支援の企画', reason: '現場で培った視点を、より大きな仕組みづくりに活かす道があります。', episode: '現場の子どもたちを見てきた視点は、より大きな仕組みを作る立場になったときに活きます。', tag: 'continue' },
        { job: '絵本作家・児童向けコンテンツ制作', reason: '子どもの心の動きを見てきた経験が、表現の土台になります。', episode: '子どもの反応を間近で見てきた経験は、表現を作る上での確かな判断材料になります。', tag: 'unrewarded' },
              { job: 'ベビーシッター・家庭訪問保育', reason: '一人ひとりに向き合う力を、より密度の高い関わり方で活かせます。', episode: '集団の中で個を見てきた経験は、一対一で向き合う仕事でも、変わらず活きます。', tag: 'repetition' },
        { job: '子育て相談の専門家', reason: '現場で見てきた子どもの発達を、悩む親のための相談業に活かせます。', episode: '多くの子どもを見てきた経験の蓄積は、一人で悩む親にとって、何より心強い専門知識になります。', tag: 'other-desire' },
        { job: '地域の子育てサロン運営', reason: '焦らず、子どもと関わる力を活かせる場所を探る時間を持つのも良い選択です。', episode: '大きく仕事を変えなくても、地域のサロンのような小さな場から、新しい関わり方を試せます。', tag: 'vague' },
        { job: '保育施設のコンサルタント', reason: '現場で培った視点を、複数の施設運営の改善提案に活かせます。', episode: '現場を知っているからこそ気づける改善点は、施設全体を見る立場になったときに強みになります。', tag: 'neutral' },
],
      uniqueSuggestion: { job: '玩具デザイナー・おもちゃ作家', reason: '子どもの反応を見てきた経験を、ものづくりに活かす道があります。', episode: '小さな変化に気づき続けてきた観察眼は、子どもが夢中になる仕掛けを形にする仕事に、そのまま息づきます。' },
    },
    {
      keywords: ['主婦', '主夫', '専業', '子育て'],
      essence: '見えないたくさんの仕事を、同時に回し続けてきたマネジメント力',
      peopleFacing: false,
      suggestions: [
        { job: 'ライフオーガナイザー', reason: '家庭というシステムを回してきた工夫は、他の家庭にとっても価値ある知恵になります。', episode: '家庭という複雑なシステムを回してきた工夫の数々は、他の家庭にとって具体的なヒントになります。', tag: 'continue' },
        { job: '地域コミュニティの運営', reason: '人と人をつなぎ、日々の暮らしを支えてきた力がそのまま活きます。', episode: '日々のやり取りの中で築いてきた人とのつながりは、地域活動の場でそのまま力になります。', tag: 'unrewarded' },
              { job: '家事代行サービスの提供者', reason: '家庭を回してきた実践的なスキルを、そのまま仕事にできます。', episode: '毎日当たり前にこなしてきた家事の工夫は、他の家庭にとっては十分にお金を払う価値のある技術です。', tag: 'repetition' },
        { job: 'オンラインでの暮らしの相談役', reason: '長年の生活の知恵を、悩んでいる人へのアドバイスとして届けられます。', episode: '家庭を切り盛りしてきた経験は、同じように悩む人にとって、何よりの実践的なヒントになります。', tag: 'other-desire' },
        { job: '地域のシェアキッチン参加者', reason: '焦らず、今の暮らしを活かせる小さな一歩を試す選択もあります。', episode: '大きく仕事を始めなくても、地域の場に少しずつ関わることから、次の一歩が見えてくることがあります。', tag: 'vague' },
        { job: '家事・育児サポートの派遣スタッフ', reason: '培ってきた家事のスキルを、そのまま仕事として活かせます。', episode: '毎日当たり前にこなしてきたことが、他の家庭にとっては十分に頼れる専門性になります。', tag: 'neutral' },
],
      uniqueSuggestion: { job: '民泊・シェアハウスの運営', reason: '家庭を切り盛りしてきた力を、他人同士が集う場の運営に活かす道があります。', episode: '見えない仕事を同時に回し続けてきたマネジメント力は、様々な人が出入りする場を整える仕事にも、静かに活きます。' },
    },
    {
      keywords: ['ドライバー', '運送', '配送', 'トラック', 'タクシー'],
      essence: '決まった時間の中で、決まった仕事を確実にやり遂げる力',
      peopleFacing: false,
      suggestions: [
        { job: '地方移住・二拠点生活のコーディネーター', reason: '土地勘と、人と接してきた経験を、暮らしの提案という形で活かせます。', episode: '各地を回って培った土地勘は、暮らしの提案をする際の説得力になります。', tag: 'continue' },
        { job: '物流まわりのコンサルタント', reason: '現場を知っているからこそ見える改善点を、仕組みづくりに活かせます。', episode: '現場を知っているからこそ気づける改善点は、仕組みを作る立場になったときに強みになります。', tag: 'unrewarded' },
              { job: '引っ越し・物流の効率化アドバイザー', reason: '現場を知っているからこその改善提案が、そのまま価値になります。', episode: '長年の運転経験で見えてきた無駄は、物流全体を効率化する仕事において、貴重な視点になります。', tag: 'repetition' },
        { job: '観光タクシー・ガイドドライバー', reason: '運転技術に、地域の魅力を伝える案内役という付加価値を加えられます。', episode: '安全に走らせる技術に、土地の物語を語る力を加えれば、観光ドライバーという新しい仕事になります。', tag: 'other-desire' },
        { job: '地方でのキャンピングカー暮らしの実践', reason: '焦らず、今の暮らし方を変えてみるという選択もあります。', episode: 'すぐに仕事を変えなくても、暮らし方そのものを変えることで、見える景色が変わることがあります。', tag: 'vague' },
        { job: '配送ルートの最適化アドバイザー', reason: '現場を知っているからこその改善提案が、そのまま価値になります。', episode: '長年の運転で培った土地勘と効率感覚は、ルート設計を見直す仕事でも、そのまま活きます。', tag: 'neutral' },
],
      uniqueSuggestion: { job: 'ラジオパーソナリティ', reason: '一人で長時間過ごす中で培った、間の取り方や語り口を活かす道もあります。', episode: '運転中に一人で言葉を紡いできた時間は、リスナーの隣に座るような語り口を持つ仕事と、意外なほど近いところにあります。' },
    },
    {
      keywords: ['美容師', '理容師', '美容室', 'ヘアサロン'],
      essence: '人の見た目だけでなく、気持ちの機微にも触れてきた感性',
      peopleFacing: true,
      suggestions: [
        { job: 'パーソナルスタイリスト', reason: '人をよく見て似合うものを見立てる力は、他の分野でも応用できます。', episode: 'お客様に似合うものを見立ててきた感覚は、他のジャンルに置き換えても十分に通用します。', tag: 'continue' },
        { job: 'セラピスト', reason: '施術中の会話で人の悩みに触れてきた経験が、傾聴を軸にした仕事につながります。', episode: '施術中の会話で悩みに触れてきた経験は、聞くことを中心にした仕事にそのままつながります。', tag: 'unrewarded' },
              { job: 'ブライダル美容の専門職', reason: '特別な日に寄り添う技術を、より専門性の高い形で発揮できます。', episode: '日々のお客様に向き合ってきた技術は、人生の特別な一日を支える仕事でも、確かな力になります。', tag: 'repetition' },
        { job: 'メイク・ヘア講師', reason: '技術を教える立場になることで、より多くの人に影響を与えられます。', episode: '自分の手で磨いてきた技術を、後進に伝える仕事に変えることで、影響力の輪を広げられます。', tag: 'other-desire' },
        { job: '地方でのゆったりとした個人サロン開業', reason: '焦らず、今の技術を活かせる働き方の形を探る選択もあります。', episode: '都会のペースを離れて、自分のペースで技術を活かす場所を探すのも、一つの道です。', tag: 'vague' },
        { job: '美容ディーラー・商品開発担当', reason: '現場で培った技術知識を、商品を作る側から活かせます。', episode: 'お客様の反応を見てきた経験は、次に求められる商品を考える仕事でも、そのまま強みになります。', tag: 'neutral' },
],
      uniqueSuggestion: { job: '舞台・映像の特殊メイクアーティスト', reason: '人の見た目を変える技術を、映画や舞台の世界で発揮する道があります。', episode: 'お客様の魅力を引き出す技術は、物語の中の人物を作り上げる仕事でも、そのまま強みになります。' },
    },
  ];

  const genericTranslation = {
    essence: 'ひとつの持ち場を、長く支え続けてきた継続力',
    peopleFacing: null,
    suggestions: [
      { job: '今の分野に近い専門アドバイザー', reason: '長く関わってきたからこそ見える視点は、教える・助言する立場になったときに強みになります。', episode: '同じ現場に長くいたからこそ気づける改善点は、助言する立場になったときに初めて価値を発揮します。', tag: 'continue' },
      { job: '複業・小さな挑戦から始める道', reason: 'いきなり職業を変えるのではなく、まず小さく試してみることで、次の力が見えてくることがあります。', episode: '大きく舵を切る前に、まず小さく試してみることで、これまで気づかなかった自分の力が見えてくることがあります。', tag: 'unrewarded' },
      { job: 'キャリア相談員', reason: '自分自身が転機を考えてきた経験を、同じ悩みを持つ人の支えに変えられます。', episode: '長く同じ場所で働いてきたからこそ分かる「動くことの怖さ」は、同じ立場の人に寄り添う言葉になります。', tag: 'repetition' },
      { job: '副業から始める新しい分野への挑戦', reason: '本業を保ちながら、新しい分野に少しずつ足を踏み入れることができます。', episode: 'いきなり全てを変えなくても、副業という小さな一歩から、新しい可能性を試すことができます。', tag: 'other-desire' },
      { job: '地域活動やボランティアからの再出発', reason: '焦らず、これまでの経験を地域に還元しながら次の道を探る選択もあります。', episode: 'すぐに答えを出さなくても、地域との関わりの中から、次に進みたい方向が見えてくることがあります。', tag: 'vague' },
      { job: '今の経験を活かした指導・研修的な役割', reason: '積み重ねてきた経験を、後進を育てる立場から活かす道もあります。', episode: '長く続けてきたからこそ持っている勘所は、教える立場になったときに初めて言葉にできる価値になります。', tag: 'neutral' },
    ],
    uniqueSuggestion: { job: '地域おこし協力隊', reason: '長く一つの場所や役割に尽くしてきた経験を、まったく新しい土地のために使う道もあります。', episode: '一つの持ち場を支え続けてきた継続力は、縁もゆかりもない土地に根を張り、信頼を積み直す仕事でも、静かな強みになります。' },
  };

  const feelingSupport = {
    continue: 'これ以上無理を重ねたくないという気持ちは、決してわがままではありません。積み重ねてきた力を、負担の少ない場所で発揮するという選択も十分にあり得ます。',
    unrewarded: '頑張りが正しく評価されていないと感じるのは、能力の問題ではなく、今いる場所との相性の問題であることが多いものです。',
    repetition: '毎日に代わり映えを感じないのは、怠けているからではなく、物事を安定してこなせるようになった証でもあります。刺激は、環境を変えることで自然と入ってくることがあります。',
    'other-desire': '心のどこかで別の道を意識できているというのは、実はとても大きな一歩です。多くの人は、その気持ちにすら気づかないまま日々を過ごしています。',
    vague: 'はっきりした不満はないのに「なんとなく違う」と感じるのは、とても繊細な感覚です。今すぐ動くべきという合図ではなく、一度棚卸しをしてもいい時期という合図かもしれません。',
  };

  function findOccupationMatch(jobText) {
    if (!jobText) return null;
    for (const entry of occupationDictionary) {
      if (entry.keywords.some((kw) => jobText.includes(kw))) return entry;
    }
    return null;
  }

  function calcExperienceYears(birthdayStr) {
    if (!birthdayStr) return null;
    const birth = new Date(birthdayStr);
    if (isNaN(birth.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age -= 1;
    const years = age - 22;
    return years > 0 ? years : null;
  }

  /* ---------------- マッチ度(擬似スコア、入力から決定的に算出) ---------------- */
  function hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = (h * 31 + s.charCodeAt(i)) >>> 0;
    }
    return h;
  }

  function matchScores(seed) {
    const h = hashStr(seed);
    const primary = 80 + (h % 15); // 80-94
    const secondary = 62 + ((h >> 3) % 18); // 62-79
    const third = 48 + ((h >> 6) % 14); // 48-61
    const fourth = 35 + ((h >> 9) % 13); // 35-47
    return [primary, secondary, third, fourth];
  }

  /* プール(6件)から、回答内容(気持ち)に重みをつけつつ、入力内容をシードにした
     擬似ランダムで4件を選ぶ。同じ回答なら毎回同じ4件になる(決定的)。 */
  function selectSuggestions(pool, seed, feeling) {
    const h = hashStr(seed);
    const scored = pool.map((item, i) => {
      let score = (h >> (i * 4)) % 100; // 0-99の擬似ランダム基礎点(項目ごとに異なるビット位置を参照)
      if (item.tag === feeling) score += 45; // 今の気持ちに合う提案を優先しやすくする
      if (item.tag === 'neutral') score += 15; // 汎用的な提案の底上げ
      return { item, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 4).map((s) => s.item);
  }

  /* ---------------- 傾向レーダーチャート ---------------- */
  const zodiacElement = {
    牡羊座: 'fire', 獅子座: 'fire', 射手座: 'fire',
    牡牛座: 'earth', 乙女座: 'earth', 山羊座: 'earth',
    双子座: 'air', 天秤座: 'air', 水瓶座: 'air',
    蟹座: 'water', 蠍座: 'water', 魚座: 'water',
  };

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  function computeTraitAxes(zodiac, feeling, occupationEntry) {
    // 4軸、各0-100。0側/100側のラベルは renderRadar 側で対応。
    let axis = { stability: 50, connection: 50, novelty: 50, pace: 50 };
    // stability: 0=安定志向 / 100=挑戦志向
    // connection: 0=単独集中 / 100=人との関わり
    // novelty: 0=これまで通り / 100=新しい刺激
    // pace: 0=じっくり型 / 100=スピード型

    const feelingAdjust = {
      continue: { stability: +25, novelty: +15 },
      unrewarded: { stability: +10, novelty: +5, connection: +5 },
      repetition: { novelty: +25, pace: +10 },
      'other-desire': { stability: +20, novelty: +20 },
      vague: { pace: -15, stability: -5 },
    };
    const fa = feelingAdjust[feeling] || {};
    Object.keys(fa).forEach((k) => { axis[k] += fa[k]; });

    const element = zodiacElement[zodiac];
    const elementAdjust = {
      fire: { stability: +15, pace: +10 },
      earth: { stability: -15, pace: -10 },
      air: { novelty: +15, connection: +5 },
      water: { connection: +15, novelty: +5 },
    };
    if (element && elementAdjust[element]) {
      Object.keys(elementAdjust[element]).forEach((k) => { axis[k] += elementAdjust[element][k]; });
    }

    if (occupationEntry && occupationEntry.peopleFacing === true) axis.connection += 15;
    if (occupationEntry && occupationEntry.peopleFacing === false) axis.connection -= 15;

    Object.keys(axis).forEach((k) => { axis[k] = clamp(axis[k], 10, 90); });
    return axis;
  }

  function renderRadarSVG(axis) {
    const size = 280;
    const center = size / 2;
    const maxR = 95;
    // 4軸: 上(stability=挑戦), 右(connection=関わり), 下(novelty=刺激), 左(pace=スピード)
    const order = ['stability', 'connection', 'novelty', 'pace'];
    const angles = [-90, 0, 90, 180]; // degrees

    function pointFor(value, angleDeg) {
      const r = (value / 100) * maxR;
      const rad = (angleDeg * Math.PI) / 180;
      return [center + r * Math.cos(rad), center + r * Math.sin(rad)];
    }

    const pts = order.map((key, i) => pointFor(axis[key], angles[i]));
    const polyPoints = pts.map((p) => p.join(',')).join(' ');

    // 目盛りの四角(25/50/75/100%)
    const gridLevels = [25, 50, 75, 100];
    const gridPolys = gridLevels.map((lvl) => {
      const gp = angles.map((a) => pointFor(lvl, a).join(',')).join(' ');
      return `<polygon points="${gp}" fill="none" stroke="#D9E1EA" stroke-width="1" />`;
    }).join('');

    const axisLines = angles.map((a) => {
      const [x, y] = pointFor(100, a);
      return `<line x1="${center}" y1="${center}" x2="${x}" y2="${y}" stroke="#D9E1EA" stroke-width="1" />`;
    }).join('');

    const labels = [
      { text: '挑戦志向', anchor: 'middle', x: center, y: center - maxR - 14 },
      { text: '人との関わり', anchor: 'start', x: center + maxR + 10, y: center + 4 },
      { text: '新しい刺激', anchor: 'middle', x: center, y: center + maxR + 22 },
      { text: 'スピード型', anchor: 'end', x: center - maxR - 10, y: center + 4 },
    ];
    const labelsOpposite = [
      { text: '安定志向', anchor: 'middle', x: center, y: center + maxR + 40 },
      { text: '単独集中', anchor: 'end', x: center - maxR - 10, y: center + 20 },
      { text: 'これまで通り', anchor: 'middle', x: center, y: center - maxR - 32 },
      { text: 'じっくり型', anchor: 'start', x: center + maxR + 10, y: center + 20 },
    ];

    const labelHtml = labels.map((l) =>
      `<text x="${l.x}" y="${l.y}" text-anchor="${l.anchor}" font-size="12" fill="#16233F" font-family="'Zen Old Mincho', serif">${l.text}</text>`
    ).join('');

    return `
      <svg viewBox="0 0 ${size} ${size + 30}" class="radar-svg">
        ${gridPolys}
        ${axisLines}
        <polygon points="${polyPoints}" fill="rgba(22,35,63,0.16)" stroke="#16233F" stroke-width="1.6" />
        ${pts.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="#16233F" />`).join('')}
        ${labelHtml}
      </svg>
    `;
  }

  /* ---------------- 星座占い(性別はここでのみ使用、職業提案には使わない) ---------------- */
  const zodiacFortune = {
    牡羊座: {
      base: '直感で動き、思い立ったらすぐに試してみたくなるタイプ。少々せっかちなところはありますが、その行動力が結果的に道を切り拓きます。',
      男性: '特にリーダー役を任されると、持ち前の勢いが一層発揮されます。',
      女性: '自分の意志をはっきり持っているぶん、頼れる存在として周囲から見られることが多いタイプです。',
    },
    牡牛座: {
      base: '変化よりも積み重ねを好み、じっくりと物事に向き合う安定感のあるタイプ。一度心を決めたら、簡単には揺らぎません。',
      男性: '地に足のついた判断力が、周囲からの厚い信頼につながります。',
      女性: '穏やかな佇まいの奥に、芯の強さを秘めているタイプです。',
    },
    双子座: {
      base: '好奇心が旺盛で、複数のことに同時に興味を持つタイプ。情報のアンテナが広く、話題が豊富です。',
      男性: '場の空気を読みながら、軽やかに立ち回る器用さを持っています。',
      女性: '話し上手なぶん、聞き役に回ったときの気配りにも定評があるタイプです。',
    },
    蟹座: {
      base: '身近な人との関係を大切にする、情に厚いタイプ。過去の思い出や積み重ねを大事にする傾向があります。',
      男性: '家族や仲間を守ろうとする責任感が、人一倍強く表れます。',
      女性: '包み込むような優しさで、周囲から頼られることが多いタイプです。',
    },
    獅子座: {
      base: '存在感があり、自然と人の中心になりやすいタイプ。誇りを持って物事に取り組みます。',
      男性: '堂々とした振る舞いが、周囲を惹きつける最大の魅力になっています。',
      女性: '華やかさの中に、面倒見の良さを併せ持つタイプです。',
    },
    乙女座: {
      base: '細やかな気配りができ、物事を丁寧に仕上げるタイプ。完璧を求めるあまり、自分に厳しくなりがちな一面もあります。',
      男性: '誠実さと几帳面さが、周囲からの高い評価に直結します。',
      女性: '気配り上手な反面、頑張りすぎてしまうこともあるタイプです。',
    },
    天秤座: {
      base: 'バランス感覚に優れ、周囲との調和を大切にするタイプ。美しいものやスマートなものを好みます。',
      男性: '公平な立場を保とうとする姿勢が、揺るぎない信頼を生みます。',
      女性: '上品な物腰の中に、しっかりとした判断軸を持つタイプです。',
    },
    蠍座: {
      base: '物事を深く掘り下げる集中力を持つタイプ。一度決めた目標や関係は、簡単に手放しません。',
      男性: '寡黙に見えても、内側には熱い情熱を秘めています。',
      女性: '静かな佇まいの奥に、強い意志を秘めているタイプです。',
    },
    射手座: {
      base: '自由を愛し、新しい世界に飛び込むことを恐れないタイプ。楽観的で、失敗をも糧に変えていきます。',
      男性: '束縛を嫌い、自分のペースを何より大切にします。',
      女性: '好奇心の赴くままに行動する、フットワークの軽さが魅力のタイプです。',
    },
    山羊座: {
      base: '着実に、地道に物事を積み上げていくタイプ。責任感が強く、周囲から頼られる存在になりやすい傾向があります。',
      男性: '目標に向かって粘り強く努力する姿勢が、確かな評価につながります。',
      女性: 'しっかり者に見られがちですが、内側では努力家な一面を持つタイプです。',
    },
    水瓶座: {
      base: '独自の視点を持ち、常識にとらわれない発想をするタイプ。人とは違う道を選ぶことに抵抗がありません。',
      男性: '自由な発想力で、周囲から一目置かれる存在になります。',
      女性: 'マイペースに見えて、実は先を見通す洞察力を持っているタイプです。',
    },
    魚座: {
      base: '感受性が豊かで、人の気持ちに寄り添うことが得意なタイプ。想像力に富み、芸術的な感性を持っています。',
      男性: '優しさの中に、繊細な芸術的センスを併せ持っています。',
      女性: '共感力の高さから、周囲の相談役になることが多いタイプです。',
    },
  };

  /* 干支・数秘術・九星気学それぞれの「気質」の一言(職業ヒントとは別に、性格描写として保持) */
  const etoTraits = {
    子: '機転の利く社交性',
    丑: '誠実な粘り強さ',
    寅: '大胆なリーダー気質',
    卯: '温和な協調性',
    辰: '大きな発想力',
    巳: '深い洞察力',
    午: '情熱的な行動力',
    未: '調和を重んじる思いやり',
    申: 'そつない器用さ',
    酉: '几帳面さ',
    戌: '義理堅い正義感',
    亥: 'まっすぐな情熱',
  };

  const numerologyTraits = {
    1: '自立心',
    2: '調和を大切にする協調性',
    3: '豊かな表現力',
    4: '堅実さ',
    5: '自由な行動力',
    6: '面倒見の良さ',
    7: '探求心',
    8: '実行力',
    9: '博愛精神',
  };

  const kyuseiTraits = {
    1: '柔軟な適応力',
    2: '縁の下の献身性',
    3: '若々しい行動力',
    4: '調和を重んじる信用力',
    5: '強い意志',
    6: '誇り高いリーダー気質',
    7: '華やかな社交性',
    8: '変化に強い粘り強さ',
    9: '知的な情熱',
  };

  function getFortuneText(zodiac, gender, eto, numerology, kyuseiNum) {
    const entry = zodiacFortune[zodiac];
    if (!entry) return null;

    const etoTrait = etoTraits[eto];
    const numTrait = numerologyTraits[numerology];
    const kyuseiName = kyuseiNames[kyuseiNum - 1];
    const kyuseiTrait = kyuseiTraits[kyuseiNum];

    let combo = '';
    if (etoTrait && numTrait && kyuseiName && kyuseiTrait) {
      combo = `${eto}年の${etoTrait}、数秘術${numerology}の${numTrait}、${kyuseiName}の${kyuseiTrait}も特徴です。`;
    }

    const addOn = (gender === '男性' || gender === '女性') ? entry[gender] : '';
    return entry.base + combo + (addOn ? addOn : '');
  }

  function runDiagnosis() {

    const loadingEl = document.getElementById('result-loading');
    const contentEl = document.getElementById('result-content');
    contentEl.classList.remove('is-visible');
    loadingEl.style.display = '';

    setTimeout(() => {
      const job = state.job.trim();
      const wish = state.wish.trim();
      const years = calcExperienceYears(state.birthday);
      const zodiac = getZodiac(state.birthday);

      const match = findOccupationMatch(job);
      const translation = match || genericTranslation;

      const paragraphs = [];

      if (years) {
        paragraphs.push(`これまでに、およそ${years}年分の経験を積み重ねてこられたはずです。`);
      }

      paragraphs.push(
        `${job || '今のお仕事'}として積み重ねてきたのは、<strong>${translation.essence}</strong>です。`
      );

      paragraphs.push(feelingSupport[state.feeling] || feelingSupport.vague);

      if (wish) {
        paragraphs.push(`気になっているという「${wish}」も、これから見ていく力の使い道と、どこかで重なっているかもしれません。`);
      }

      document.getElementById('result-tag').textContent = '可能性診断・結果';
      document.getElementById('result-title').textContent = 'あなたの経験は、こう翻訳できます';
      document.getElementById('result-body').innerHTML = paragraphs.map((p) => `<p>${p}</p>`).join('');

      // 星座占い(性別はここでのみ反映。職業提案のロジックには使用しない)
      const eto = getEto(new Date(state.birthday).getFullYear());
      const numerology = getNumerology(state.birthday);
      const kyuseiNum = getKyuseiNumber(state.birthday);
      const fortuneText = getFortuneText(zodiac, state.gender, eto, numerology, kyuseiNum);
      if (fortuneText) {
        document.getElementById('result-body').innerHTML += `
          <div class="fortune-block">
            <p class="fortune-heading">生まれ持った気質</p>
            <p class="fortune-text">${fortuneText}</p>
          </div>
        `;
      }

      // 傾向レーダーチャート
      const axis = computeTraitAxes(zodiac, state.feeling, match);
      document.getElementById('result-body').innerHTML += `
        <div class="radar-block">
          <p class="radar-title">あなたの傾向</p>
          ${renderRadarSVG(axis)}
        </div>
      `;

      // マッチ度つきの提案カード(6件のプールから、気持ちの回答で重み付けした4件を選ぶ)
      const seed = `${job}|${state.feeling}|${zodiac}|${wish}`;
      const scores = matchScores(seed);
      const selectedSuggestions = selectSuggestions(translation.suggestions, seed, state.feeling);
      let suggestionHtml = selectedSuggestions.map((s, i) => `
        <div class="suggestion-card">
          <div class="suggestion-head">
            <span class="suggestion-job">${s.job}</span>
            <span class="suggestion-score">適合度 ${scores[i]}%</span>
          </div>
          <span class="suggestion-reason">${s.reason}</span>
          <span class="suggestion-episode">${s.episode}</span>
        </div>
      `).join('');

      // 提示した候補通りの職業を選んだ人には、もう一歩踏み込んだ意外性のある提案を追加する
      if (state.jobMatchedCandidate === true && translation.uniqueSuggestion) {
        const u = translation.uniqueSuggestion;
        suggestionHtml += `
          <div class="suggestion-card suggestion-card-wildcard">
            <div class="suggestion-head">
              <span class="suggestion-job">${u.job}</span>
              <span class="suggestion-score suggestion-score-wildcard">意外性のある提案</span>
            </div>
            <span class="suggestion-reason">${u.reason}</span>
            <span class="suggestion-episode">${u.episode}</span>
          </div>
        `;
      }

      document.getElementById('result-body').innerHTML += `<div class="suggestion-list">${suggestionHtml}</div>`;

      if (!match) {
        document.getElementById('result-body').innerHTML += `<p style="color:var(--muted); font-size:0.88rem;">※ 今回は具体的な職種の候補が見つからなかったため、一般的な提案を表示しています。</p>`;
      }

      const shareJob = selectedSuggestions[0].job;
      const shareText = `私の経験は「${shareJob}」に翻訳されました。｜エミの運命道`;
      const shareUrl = window.location.href.split('#')[0];

      document.getElementById('share-x').href =
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
      document.getElementById('share-line').href =
        `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;

      loadingEl.style.display = 'none';
      contentEl.classList.add('is-visible');
    }, 1400);
  }

  /* ---------------- リスタート ---------------- */
  document.getElementById('btn-restart').addEventListener('click', () => {
    state.gender = null;
    state.birthday = '1980-04-02';
    state.job = '';
    state.jobMatchedCandidate = null;
    state.feeling = null;
    state.wish = '';

    genderButtons.forEach((b) => b.classList.remove('is-selected'));
    feelingButtons.forEach((b) => b.classList.remove('is-selected'));
    birthdayInput.value = '1980-04-02';
    jobChoicesContainer.querySelectorAll('.choice-card').forEach((b) => b.classList.remove('is-selected'));
    jobOtherInput.style.display = 'none';
    jobOtherInput.value = '';
    wishChoicesContainer.querySelectorAll('.choice-card').forEach((b) => b.classList.remove('is-selected'));
    wishOtherInput.style.display = 'none';
    wishOtherInput.value = '';
    toStep2Btn.disabled = true;
    toStep3Btn.disabled = true;

    goTo('landing');
  });

});
