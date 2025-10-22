import React from 'react';

const Dashboard: React.FC = () => {
    const stats = [
        { title: 'Total Users', value: '2,543', change: '+12%', color: 'text-blue-600' },
        { title: 'Revenue', value: '$45,231', change: '+8%', color: 'text-green-600' },
        { title: 'Orders', value: '892', change: '-3%', color: 'text-orange-600' },
        { title: 'Active Now', value: '127', change: '+5%', color: 'text-purple-600' },
    ];

    return (
        <>
            <div className="mb-6">
                <h2 className="text-3xl font-bold">Dashboard</h2>
                <p className="mt-1 text-base-content/60">Welcome back, here's what's happening</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <div key={stat.title} className="shadow-lg card bg-base-100">
                        <div className="card-body">
                            <h3 className="text-sm font-medium text-base-content/60">{stat.title}</h3>
                            <div className="flex items-end justify-between mt-2">
                                <p className="text-3xl font-bold">{stat.value}</p>
                                <span className={`text-sm font-semibold ${stat.color}`}>{stat.change}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="shadow-lg card bg-base-100">
                    <div className="card-body">
                        <h3 className="card-title">Recent Orders</h3>
                        <div className="overflow-x-auto">
                            <table className="table table-zebra">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Customer</th>
                                        <th>Status</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>#1234</td>
                                        <td>Alice Johnson</td>
                                        <td><span className="badge badge-success">Completed</span></td>
                                        <td>$234.00</td>
                                    </tr>
                                    <tr>
                                        <td>#1235</td>
                                        <td>Bob Smith</td>
                                        <td><span className="badge badge-warning">Pending</span></td>
                                        <td>$156.50</td>
                                    </tr>
                                    <tr>
                                        <td>#1236</td>
                                        <td>Carol White</td>
                                        <td><span className="badge badge-info">Processing</span></td>
                                        <td>$789.00</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="shadow-lg card bg-base-100">
                    <div className="card-body">
                        <h3 className="card-title">Quick Actions</h3>
                        <div className="mt-4 space-y-2">
                            <button className="btn btn-primary btn-block">Create New Order</button>
                            <button className="btn btn-secondary btn-block">Add User</button>
                            <button className="btn btn-accent btn-block">Generate Report</button>
                            <button className="btn btn-outline btn-block">View All Analytics</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Dashboard