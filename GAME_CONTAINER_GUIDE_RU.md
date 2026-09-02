# N-A-V-A Game Container — как добавлять новые игры

## Главное правило
Страница `/game/{slug}/play` больше не содержит `script` или `link`, написанных специально под конкретную игру.
Она создаёт один контейнер:

`#game-root`

и передаёт игру в единый хост:

`NAVA_GAME_HOST.mount(container, context)`

Хост сам строит путь из поля `games.path`, автоматически пытается подключить:

- `{path}/style.css`
- `{path}/index.js`

Поэтому PHP-код не нужно переписывать при добавлении новой игры.

## Стандарт новой игры
В `index.js` игра должна зарегистрироваться одним вызовом:

```js
window.NAVA_GAME.register({
  slug: 'my-game',
  async mount(container, context) {
    container.innerHTML = '<canvas></canvas>';
    const game = new MyGame(container, context);
    game.start();

    return {
      destroy() {
        game.destroy?.();
      }
    };
  }
});
```

Хост передаёт:

- `context.gameId`
- `context.slug`
- `context.title`
- `context.path`
- `context.user.userId`
- `context.user.userNickname`

## Минимальная структура новой игры

```text
public/games/my-game/
├── index.js
├── style.css        (необязательно, но рекомендуется)
└── assets/
```

## Добавление игры в БД

```sql
INSERT INTO games
(slug,title,description,image,icon,category,game_type,players,is_multiplayer,path,is_active,entry_version)
VALUES
('my-game','Моя игра','Описание','/games/my-game/cover.webp','/games/my-game/icon.webp','logic','web','1-4',1,'/games/my-game/',1,'1');
```

После этого игра автоматически появляется в библиотеке.

## Типы

- `game_type = 'web'` — браузерная игра, запускаемая в контейнере.
- `game_type = 'live'` — живая игра для компании. Её `mount()` может вместо canvas показать ведущий экран, управление комнатой или режим ведущего.

## Совместимость со старыми играми

Если старый `index.js` создаёт глобальный объект `window.Game` с методом:

`Game.init(container, options)`

новый хост автоматически использует его. Это позволяет постепенно переносить старые игры без изменения страницы запуска.

## Важное ограничение безопасности

Игра должна работать только внутри переданного контейнера. Не следует обращаться к DOM сайта по глобальным селекторам, кроме собственных элементов игры. Так каждая игра будет изолирована логически и не сломает библиотеку.


## Почему страницы игры используют `/game/...`, а файлы игры `/games/...`

Это сделано намеренно. `/games/<slug>/` является физической папкой с JavaScript, CSS и ресурсами игры. Если одновременно использовать `/games/<slug>` как динамическую PHP-страницу, Apache на некоторых конфигурациях сначала пытается открыть физическую папку и из-за отключённого листинга возвращает **403 Forbidden**. Поэтому:

- страница информации: `/game/<slug>`;
- запуск: `/game/<slug>/play`;
- статические файлы игры: `/games/<slug>/`.

Так новая игра подключается одной записью `path` и одним входным файлом `index.js`, но маршруты сайта никогда не конфликтуют с реальными папками.
