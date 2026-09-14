document.addEventListener('DOMContentLoaded', () => {

  /* ---------------- 状態管理 ---------------- */
  const state = {
    gender: null,
    birthday: null,
    job: '',
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

  function renderJobChoices() {
    const zodiac = getZodiac(state.birthday);
    const hints = zodiac ? zodiacJobHints[zodiac] : null;

    if (zodiac && hints) {
      jobLabelEl.textContent = `${zodiac}生まれのあなたに浮かぶ仕事は、近いものがありますか？`;
      document.getElementById('q-job-hint').textContent = '星座の傾向から見た候補です。近いものがあれば選んでください';
    } else {
      jobLabelEl.textContent = '今のお仕事は何ですか？';
      document.getElementById('q-job-hint').textContent = '職種や業種を、思いつくままで大丈夫です';
    }

    const options = hints ? [...hints, 'その他(自分で入力する)'] : ['その他(自分で入力する)'];

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
        } else {
          jobOtherInput.style.display = 'none';
          state.job = btn.dataset.value;
        }
        checkStep2();
      });
    });
  }

  jobOtherInput.addEventListener('input', () => {
    state.job = jobOtherInput.value;
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
      wishLabelEl.textContent = 'ここまでの回答をもとに、こんな仕事が浮かびますが、気になるものはありますか？';
      document.getElementById('q-wish-hint').textContent = `${zodiac}生まれと、ここまでの回答から見えてきた候補です。近いものがなければ「その他」へ`;
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
        { job: '生け花の先生', reason: '一瞬の判断と、美しい所作を積み重ねてきた修練が、花を通した表現に自然と重なります。', episode: '現場で「型を体に染み込ませるまで繰り返す」姿勢を培ってきたことは、稽古を通じて感覚を磨いていく生け花の世界でも、そのまま強みになります。' },
        { job: '防災・危機管理の講師', reason: '現場で培った冷静な判断力を、企業や地域に伝える形で活かせます。', episode: 'とっさの判断を求められる現場に立ち続けてきた経験は、伝える立場になったときに、机上の知識にはない説得力になります。' },
      ],
    },
    {
      keywords: ['警察官', '警察', '刑事', '交番'],
      essence: '初対面の相手を観察し、短い時間で信頼を築く力',
      peopleFacing: true,
      suggestions: [
        { job: '営業職', reason: '人の表情や言葉の裏にある本音を読み取る力は、信頼関係が要となる営業でそのまま活きます。', episode: '初対面の相手の些細な変化に気づいてきた観察眼は、商談の場でも「今、何を求めているか」を読み取る力として活きます。' },
        { job: '人材コーディネーター', reason: '人を見極め、適切な場所につなぐという役割は、日々の仕事の延長線上にあります。', episode: '人を見極め、適切な場所に導いてきた経験は、転職支援の現場でもそのまま応用できます。' },
      ],
    },
    {
      keywords: ['看護師', 'ナース', '看護'],
      essence: '人の弱さに寄り添い、支え続ける力',
      peopleFacing: true,
      suggestions: [
        { job: 'キャリアカウンセラー', reason: '相手の状態を見立て、必要な支えを差し出す力は、仕事の悩みに寄り添う場面でも活きます。', episode: '患者さんの状態を見立て、必要な言葉をかけてきた経験は、キャリアに悩む人の話を聞く場面でも活きます。' },
        { job: '産業保健スタッフ', reason: '医療の知識と、人に寄り添う姿勢を、企業で働く人たちのために使う道があります。', episode: '医療の知識だけでなく、忙しい人に無理なく寄り添ってきた経験が、働く人の健康管理という仕事に直結します。' },
      ],
    },
    {
      keywords: ['教師', '教員', '学校の先生'],
      essence: '複雑なことを、相手に合わせてわかりやすく伝える力',
      peopleFacing: true,
      suggestions: [
        { job: '企業研修講師', reason: '教えることのプロとしての経験は、大人向けの研修にもそのまま応用できます。', episode: '同じ内容でも相手のレベルに合わせて説明を変えてきた経験は、社会人研修の現場でそのまま武器になります。' },
        { job: 'ライター', reason: '伝わる言葉を選ぶ力は、文章という形に置き換えても発揮できます。', episode: '難しいことをかみ砕いて伝えてきた積み重ねは、文章という形に変えても十分に通用します。' },
      ],
    },
    {
      keywords: ['経理', '会計', '総務', '事務'],
      essence: '細部を見落とさず、正確に積み上げていく力',
      peopleFacing: false,
      suggestions: [
        { job: 'ファイナンシャルプランナー', reason: '数字と誠実に向き合ってきた姿勢は、個人のお金の相談に乗る仕事でも信頼につながります。', episode: '数字のズレを見逃さず、こつこつ確認してきた姿勢は、お金の相談に乗る仕事で大きな信頼につながります。' },
        { job: '士業事務所のアシスタント', reason: '正確さと粘り強さが求められる仕事との相性が良い傾向にあります。', episode: '正確な処理を積み重ねてきた実績は、専門家のそばで仕事をする際に、そのまま評価されるポイントになります。' },
      ],
    },
    {
      keywords: ['営業'],
      essence: '人との関係を築き、数字という結果に落とし込む力',
      peopleFacing: true,
      suggestions: [
        { job: '独立系の営業代行・コンサルタント', reason: 'これまで培った関係構築力を、特定の会社ではなく自分の看板で活かす道があります。', episode: '特定の商品を売る力ではなく、人との関係を築く力そのものを、自分の看板で使う道があります。' },
        { job: 'カスタマーサクセス', reason: '売ることだけでなく、相手を成功に導く力として応用できます。', episode: '契約を取るまでで終わらせず、その後の関係を大切にしてきた姿勢は、顧客の成功を支える仕事にそのまま向いています。' },
      ],
    },
    {
      keywords: ['販売', '接客', '店員', 'ショップ'],
      essence: '目の前の人の反応を読み、瞬時に対応を変える力',
      peopleFacing: true,
      suggestions: [
        { job: '接客・接遇の講師業', reason: '現場で培った感覚は、言葉にして人に教えるという形でも価値を持ちます。', episode: 'お客様の顔色を見て、対応を変えてきた感覚は、言葉にして人に伝えることでさらに価値を持ちます。' },
        { job: 'カスタマーサクセス', reason: 'お客様に寄り添ってきた経験が、契約後の関係づくりに活かせます。', episode: '目の前の一人に向き合ってきた経験は、契約後も長く関わる仕事において強みになります。' },
      ],
    },
    {
      keywords: ['エンジニア', 'SE', 'プログラマ', 'システム', 'IT'],
      essence: '複雑な問題を分解し、順序立てて解決する力',
      peopleFacing: false,
      suggestions: [
        { job: '小さな事業の立ち上げ', reason: '仕組みを設計する力は、自分の事業を組み立てる際の土台になります。', episode: '複雑な要件を整理し、動くものに落とし込んできた経験は、自分の事業を一から組み立てる際の土台になります。' },
        { job: '技術顧問・アドバイザー', reason: '積み上げてきた専門知識を、現場を離れた形で伝える道もあります。', episode: '現場で培った知識は、実際に手を動かさなくても、助言という形で十分な価値を持ちます。' },
      ],
    },
    {
      keywords: ['公務員', '市役所', '区役所', '行政', '役場'],
      essence: '立場の異なる人たちの利害を調整する力',
      peopleFacing: false,
      suggestions: [
        { job: 'NPO・地域団体の運営', reason: '公共のために動いてきた経験は、地域の課題解決の現場でそのまま活きます。', episode: '立場の異なる人たちの意見を聞き、間を取り持ってきた経験は、地域活動の現場でそのまま活きます。' },
        { job: '地域コーディネーター', reason: '行政と住民の間に立ってきた経験が、橋渡し役として力を発揮します。', episode: '制度と現場の両方を知っているからこそ、住民と行政の橋渡し役として重宝されます。' },
      ],
    },
    {
      keywords: ['飲食', '調理', 'ホール', '料理人', 'シェフ', 'コック'],
      essence: '限られた時間の中で、複数のことを同時にこなす力',
      peopleFacing: true,
      suggestions: [
        { job: '食育インストラクター', reason: '食への知識と経験を、次の世代に伝える形に翻訳できます。', episode: '毎日の調理で培った知識は、伝える相手を変えるだけで、新しい価値になります。' },
        { job: '小さな宿・ゲストハウスの運営', reason: 'おもてなしの感覚と現場力を、宿泊という形で発揮する道があります。', episode: '限られた時間で複数のことを回してきた現場力は、宿泊業の忙しい時間帯でもそのまま活きます。' },
      ],
    },
    {
      keywords: ['自衛官', '自衛隊'],
      essence: '厳しい環境の中でも、チームを機能させる力',
      peopleFacing: false,
      suggestions: [
        { job: '危機管理コンサルタント', reason: '有事を想定して備える視点は、企業のリスク管理にそのまま応用できます。', episode: '最悪の事態を想定して備えてきた視点は、企業のリスク管理においてそのまま貴重な視点になります。' },
        { job: 'アウトドア・野外活動インストラクター', reason: '体力と統率力を、自然の中での指導という形で活かせます。', episode: '体力とチームをまとめる力は、自然の中での指導という場でも発揮できます。' },
      ],
    },
    {
      keywords: ['保育士', '幼稚園', '保育'],
      essence: '小さな変化に気づき、根気強く向き合う力',
      peopleFacing: true,
      suggestions: [
        { job: '企業内保育・子育て支援の企画', reason: '現場で培った視点を、より大きな仕組みづくりに活かす道があります。', episode: '現場の子どもたちを見てきた視点は、より大きな仕組みを作る立場になったときに活きます。' },
        { job: '絵本作家・児童向けコンテンツ制作', reason: '子どもの心の動きを見てきた経験が、表現の土台になります。', episode: '子どもの反応を間近で見てきた経験は、表現を作る上での確かな判断材料になります。' },
      ],
    },
    {
      keywords: ['主婦', '主夫', '専業', '子育て'],
      essence: '見えないたくさんの仕事を、同時に回し続けてきたマネジメント力',
      peopleFacing: false,
      suggestions: [
        { job: 'ライフオーガナイザー', reason: '家庭というシステムを回してきた工夫は、他の家庭にとっても価値ある知恵になります。', episode: '家庭という複雑なシステムを回してきた工夫の数々は、他の家庭にとって具体的なヒントになります。' },
        { job: '地域コミュニティの運営', reason: '人と人をつなぎ、日々の暮らしを支えてきた力がそのまま活きます。', episode: '日々のやり取りの中で築いてきた人とのつながりは、地域活動の場でそのまま力になります。' },
      ],
    },
    {
      keywords: ['ドライバー', '運送', '配送', 'トラック', 'タクシー'],
      essence: '決まった時間の中で、決まった仕事を確実にやり遂げる力',
      peopleFacing: false,
      suggestions: [
        { job: '地方移住・二拠点生活のコーディネーター', reason: '土地勘と、人と接してきた経験を、暮らしの提案という形で活かせます。', episode: '各地を回って培った土地勘は、暮らしの提案をする際の説得力になります。' },
        { job: '物流まわりのコンサルタント', reason: '現場を知っているからこそ見える改善点を、仕組みづくりに活かせます。', episode: '現場を知っているからこそ気づける改善点は、仕組みを作る立場になったときに強みになります。' },
      ],
    },
    {
      keywords: ['美容師', '理容師', '美容室', 'ヘアサロン'],
      essence: '人の見た目だけでなく、気持ちの機微にも触れてきた感性',
      peopleFacing: true,
      suggestions: [
        { job: 'パーソナルスタイリスト', reason: '人をよく見て似合うものを見立てる力は、他の分野でも応用できます。', episode: 'お客様に似合うものを見立ててきた感覚は、他のジャンルに置き換えても十分に通用します。' },
        { job: 'セラピスト', reason: '施術中の会話で人の悩みに触れてきた経験が、傾聴を軸にした仕事につながります。', episode: '施術中の会話で悩みに触れてきた経験は、聞くことを中心にした仕事にそのままつながります。' },
      ],
    },
  ];

  const genericTranslation = {
    essence: 'ひとつの持ち場を、長く支え続けてきた継続力',
    peopleFacing: null,
    suggestions: [
      { job: '今の分野に近い専門アドバイザー', reason: '長く関わってきたからこそ見える視点は、教える・助言する立場になったときに強みになります。', episode: '同じ現場に長くいたからこそ気づける改善点は、助言する立場になったときに初めて価値を発揮します。' },
      { job: '複業・小さな挑戦から始める道', reason: 'いきなり職業を変えるのではなく、まず小さく試してみることで、次の力が見えてくることがあります。', episode: '大きく舵を切る前に、まず小さく試してみることで、これまで気づかなかった自分の力が見えてくることがあります。' },
    ],
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
    return [primary, secondary];
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

      // 傾向レーダーチャート
      const axis = computeTraitAxes(zodiac, state.feeling, match);
      document.getElementById('result-body').innerHTML += `
        <div class="radar-block">
          <p class="radar-title">あなたの傾向</p>
          ${renderRadarSVG(axis)}
        </div>
      `;

      // マッチ度つきの提案カード
      const seed = `${job}|${state.feeling}|${zodiac}|${wish}`;
      const scores = matchScores(seed);
      const suggestionHtml = translation.suggestions.map((s, i) => `
        <div class="suggestion-card">
          <div class="suggestion-head">
            <span class="suggestion-job">${s.job}</span>
            <span class="suggestion-score">適合度 ${scores[i]}%</span>
          </div>
          <span class="suggestion-reason">${s.reason}</span>
          <span class="suggestion-episode">${s.episode}</span>
        </div>
      `).join('');
      document.getElementById('result-body').innerHTML += `<div class="suggestion-list">${suggestionHtml}</div>`;

      if (!match) {
        document.getElementById('result-body').innerHTML += `<p style="color:var(--muted); font-size:0.88rem;">※ 今回は具体的な職種の候補が見つからなかったため、一般的な提案を表示しています。</p>`;
      }

      const shareJob = translation.suggestions[0].job;
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
    state.birthday = null;
    state.job = '';
    state.feeling = null;
    state.wish = '';

    genderButtons.forEach((b) => b.classList.remove('is-selected'));
    feelingButtons.forEach((b) => b.classList.remove('is-selected'));
    birthdayInput.value = '';
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
