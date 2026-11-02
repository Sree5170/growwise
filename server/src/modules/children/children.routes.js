import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorizeRole } from '../../middleware/authorizeRole.js';
import { authorizeChildAccess } from '../../middleware/authorizeChildAccess.js';
import { validate } from '../../middleware/validateRequest.js';
import { createChildSchema, updateChildSchema, idParam } from './children.validation.js';
import * as c from './children.controller.js';
import { tasksForChild } from '../tasks/tasks.routes.js';
import { physicalForChild } from '../physicalActivity/physicalActivity.routes.js';
import { gamesForChild } from '../games/games.routes.js';
import { progressForChild } from '../progress/progress.routes.js';
import { recommendationsForChild } from '../recommendations/recommendations.routes.js';
import { badgesForChild } from '../rewards/rewards.routes.js';

const r = Router();
r.use(authenticate);

// Child-mode sessions may READ their own profile; only parents manage profiles.
r.get('/', authorizeRole('parent', 'admin'), c.list);
r.post('/', authorizeRole('parent', 'admin'), validate(createChildSchema), c.create);
r.get('/:id', validate(idParam), authorizeChildAccess(), c.getOne);
r.patch('/:id', authorizeRole('parent', 'admin'), validate(updateChildSchema), authorizeChildAccess(), c.update);
r.delete('/:id', authorizeRole('parent', 'admin'), validate(idParam), authorizeChildAccess(), c.remove);
r.post('/:id/session', authorizeRole('parent', 'admin'), validate(idParam), authorizeChildAccess(), c.startChildSession);

// Nested read endpoints (each re-checks ownership through authorizeChildAccess)
r.get('/:id/tasks', validate(idParam), authorizeChildAccess(), tasksForChild);
r.get('/:id/physical-activity', validate(idParam), authorizeChildAccess(), physicalForChild);
r.get('/:id/games/progress', validate(idParam), authorizeChildAccess(), gamesForChild);
r.get('/:id/progress', validate(idParam), authorizeChildAccess(), progressForChild.progress);
r.get('/:id/reports/weekly', authorizeRole('parent', 'admin'), validate(idParam), authorizeChildAccess(), progressForChild.weekly);
r.get('/:id/recommendations', validate(idParam), authorizeChildAccess(), recommendationsForChild);
r.get('/:id/badges', validate(idParam), authorizeChildAccess(), badgesForChild);
export default r;
