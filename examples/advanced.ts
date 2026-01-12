import {
    WgEasyClient,
    ClientCollection,
    IClientFilter
} from '../src';

async function advancedUsage() {
    const wg = await WgEasyClient.connect({
        baseUrl: 'http://localhost:51821',
        password: 'your-password',
    });

    // Bulk creation
    const newClients = await wg.clients.bulkCreate([
        'device-1',
        'device-2',
        'device-3',
    ]);
    console.log(`Created ${newClients.length} clients`);

    // Complex filtering
    const filter: IClientFilter = {
        enabled: true,
        hasRecentHandshake: true,
        minTransferTx: 1024 * 1024, // Minimum 1MB sent
    };

    const filteredClients = await wg.clients.filter(filter);
    console.log(`Filtered: ${filteredClients.size} active clients with traffic`);

    // Sorting
    const clients = await wg.getClients();

    const sortedByName = clients.sortByName();
    const sortedByTraffic = clients.sortByTransfer();
    const sortedByDate = clients.sortByCreatedAt(false); // Newest first

    // Export configurations
    const exports = await wg.configs.exportAllClients();
    for (const exp of exports) {
        console.log(`Export: ${exp.clientName}`);
        const { filename, content } = wg.configs.generateConfigFile(exp.configuration, exp.clientName);
        // Save to file: fs.writeFileSync(filename, content);
    }

    // Parse configuration
    const config = await wg.getClientConfig(newClients[0]!.id);
    const parsed = wg.configs.parseConfigFile(config);
    console.log('Parsed config:', parsed);

    // Working with collection
    const collection = await wg.getClients();

    // Chaining
    const result = collection
        .filterBy({ enabled: true })
        .sortByName()
        .paginate({ page: 1, limit: 5 });

    console.log(`Result: ${result.items.length}/${result.total}`);

    // Bulk operations
    const ids = newClients.map(c => c.id);
    await wg.clients.bulkDisable(ids);
    await wg.clients.bulkEnable(ids);
    await wg.clients.bulkDelete(ids);

    await wg.logout();
}

advancedUsage();