# @mainmatter/ember-api-actions

This is an [Ember.js] addon allowing you to easily implement non-[CRUD] actions
for your [Ember Data] models.


## Compatibility

* Ember.js v3.28 or above
* Ember CLI v3.28 or above
* Node.js v14 or above


## Installation

```
ember install @mainmatter/ember-api-actions
```


## Usage

```js
import Model from '@ember-data/model';
import { apiAction } from '@mainmatter/ember-api-actions';

class User extends Model {
  async follow() {
    return await apiAction(this, { method: 'PUT', path: 'follow' });
  }
}
```


## Contributing

See the [Contributing](CONTRIBUTING.md) guide for details.


## License

This project is licensed under the [MIT License](LICENSE.md).

[Ember.js]: https://emberjs.com
[CRUD]: https://en.wikipedia.org/wiki/Create,_read,_update_and_delete
[Ember Data]: https://github.com/emberjs/data
