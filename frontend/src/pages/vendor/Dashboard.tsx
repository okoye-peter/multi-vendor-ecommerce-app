

const Dashboard = () => {
    return (
        <div>
            <h1 className="mb-6 text-3xl font-bold">Dashboard Overview</h1>
            <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
                <div className="shadow-lg card bg-primary text-primary-content">
                    <div className="card-body">
                        <h2 className="text-lg card-title">Total Sales</h2>
                        <p className="text-3xl font-bold">$45,231</p>
                        <p className="text-sm opacity-80">+12% from last month</p>
                    </div>
                </div>
                <div className="shadow-lg card bg-secondary text-secondary-content">
                    <div className="card-body">
                        <h2 className="text-lg card-title">Total Orders</h2>
                        <p className="text-3xl font-bold">1,234</p>
                        <p className="text-sm opacity-80">+8% from last month</p>
                    </div>
                </div>
                <div className="shadow-lg card bg-accent text-accent-content">
                    <div className="card-body">
                        <h2 className="text-lg card-title">Products</h2>
                        <p className="text-3xl font-bold">456</p>
                        <p className="text-sm opacity-80">23 low stock</p>
                    </div>
                </div>
                <div className="shadow-lg card bg-warning text-warning-content">
                    <div className="card-body">
                        <h2 className="text-lg card-title">Pending</h2>
                        <p className="text-3xl font-bold">34</p>
                        <p className="text-sm opacity-80">Orders to process</p>
                    </div>
                </div>
            </div>

            <div className="shadow-xl card bg-base-100">
                <div className="card-body">
                    <h2 className="mb-4 text-xl card-title">Recent Activity</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-base-200">
                            <div>
                                <p className="font-semibold">New Order #1234</p>
                                <p className="text-sm opacity-70">5 minutes ago</p>
                            </div>
                            <div className="badge badge-success">Completed</div>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-base-200">
                            <div>
                                <p className="font-semibold">Product Added: Blue T-Shirt</p>
                                <p className="text-sm opacity-70">1 hour ago</p>
                            </div>
                            <div className="badge badge-info">New</div>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-base-200">
                            <div>
                                <p className="font-semibold">Return Request #891</p>
                                <p className="text-sm opacity-70">3 hours ago</p>
                            </div>
                            <div className="badge badge-warning">Pending</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard