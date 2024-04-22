// =====================================================================================
// ==  Description: This file is used to delete existing datasets from the database.  ==
// =====================================================================================

import { deleteAllDatasets } from './db.js';

export async function deleteAllDBDatasets() {
    await deleteAllDatasets();
    return 'Database Records have been Deleted';
}
