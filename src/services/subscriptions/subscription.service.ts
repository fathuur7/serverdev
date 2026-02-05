/**
 * Subscription Service
 * Re-exports all subscription operations from separate modules
 */

// CRUD Operations
export {
    createSubscription,
    getAllSubscriptions,
    getSubscriptionById,
    updateSubscription,
    softDeleteSubscription,
    upgradeSubscription,
} from "./subscription.crud";

// Lifecycle Operations
export {
    activateSubscription,
    isolateSubscription,
    terminateSubscription,
    isolateOverdueSubscriptions,
} from "./subscription.lifecycle";

/**
 * SubscriptionService Class (for backward compatibility)
 */
import * as crud from "./subscription.crud";
import * as lifecycle from "./subscription.lifecycle";

export class SubscriptionService {
    // CRUD
    create = crud.createSubscription;
    getAll = crud.getAllSubscriptions;
    getById = crud.getSubscriptionById;
    update = crud.updateSubscription;
    softDelete = crud.softDeleteSubscription;
    upgrade = crud.upgradeSubscription;

    // Lifecycle
    activate = lifecycle.activateSubscription;
    isolate = lifecycle.isolateSubscription;
    terminate = lifecycle.terminateSubscription;
    isolateOverdueSubscriptions = lifecycle.isolateOverdueSubscriptions;
}
