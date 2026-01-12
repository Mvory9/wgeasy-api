import {
    WgEasyClient,
    LogLevel,
    Client,
    ClientNotFoundException
} from '../src';

async function main() {
    // Create client
    const wg = new WgEasyClient({
        baseUrl: 'http://localhost:51821',
        password: 'your-password',
        timeout: 30000,
        logLevel: LogLevel.DEBUG,
    });

    // Or from environment variables
    // const wg = WgEasyClient.fromEnv();

    // Or with auto-connect
    // const wg = await WgEasyClient.connect({ ... });

    try {
        // Initialize (automatic authentication)
        await wg.initialize();

        // ===== Events =====

        wg.on<{ client: Client }>('client:created', ({ client }) => {
            console.log(`Event: Client created - ${client.name}`);
        });

        wg.on<{ client: Client }>('client:deleted', ({ client }) => {
            console.log(`Event: Client deleted - ${client.name}`);
        });

        wg.on<{ client: Client }>('client:updated', ({ client }) => {
            console.log(`Event: Client updated - ${client.name}`);
        });

        wg.on<{ client: Client }>('client:enabled', ({ client }) => {
            console.log(`Event: Client enabled - ${client.name}`);
        });

        wg.on<{ client: Client }>('client:disabled', ({ client }) => {
            console.log(`Event: Client disabled - ${client.name}`);
        });

        // ===== Working with clients =====

        // Get all clients
        const clients = await wg.getClients();
        console.log(`Total clients: ${clients.size}`);

        // Iterate over clients
        for (const client of clients) {
            console.log(`- ${client.name}: ${client.isOnline ? 'online' : 'offline'}`);
        }

        // Create new client
        const newClient: Client = await wg.createClient('my-new-device');
        console.log(`Created: ${newClient.name} (${newClient.id})`);

        console.log(newClient);

        // Get configuration
        const config = await wg.getClientConfig(newClient.id);
        console.log('Configuration:', config);

        // Get QR code
        const qrCode = await wg.getClientQrCode(newClient.id);
        console.log('QR Code SVG:', qrCode.substring(0, 100) + '...');

        // Disable client
        await wg.disableClient(newClient.id);
        console.log('Client disabled');

        // Enable client
        await wg.enableClient(newClient.id);
        console.log('Client enabled');

        // ===== Advanced operations =====

        // Filtering
        const onlineClients = await wg.clients.getOnline();
        console.log(`Online clients: ${onlineClients.size}`);

        // Search
        const searchResults = await wg.clients.search('my-');
        console.log(`Found: ${searchResults.size} clients`);

        // Statistics
        const stats = await wg.clients.getStatistics();
        console.log('Statistics:', stats);

        // Pagination
        const page = await wg.clients.paginate({ page: 1, limit: 10 });
        console.log(`Page 1: ${page.items.length} items, Total: ${page.total}`);

        // Delete client
        await wg.deleteClient(newClient.id);
        console.log('Client deleted');

        console.log('\n=== Event listeners are active. Process will keep running. ===');
        console.log('Note: Events are only triggered by API calls, not by manual changes in the admin panel.');
        console.log('Press Ctrl+C to exit.\n');

        // События работают только на действия через API клиента
        await new Promise<void>((resolve) => {
            process.on('SIGINT', () => {
                console.log('\nShutting down...');
                resolve();
            });
            process.on('SIGTERM', () => {
                console.log('\nShutting down...');
                resolve();
            });
        });

    } catch (error) {
        if (error instanceof ClientNotFoundException) {
            console.error(`Client not found: ${error.clientId}`);
        } else {
            console.error('Error:', error);
        }
    } finally {
        await wg.logout();
    }
}

main();