import { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import Card, { CardHeader, CardTitle } from '../../components/common/Card';
import { useApiQuery } from '../../hooks/useApi';
import { HiOutlineDocumentChartBar, HiOutlineAcademicCap, HiOutlineUserGroup } from 'react-icons/hi2';

export default function DeptReports() {
    const { data: dashboard, isLoading } = useApiQuery('hod-dashboard', '/hod/dashboard');

    return (
        <PageWrapper>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900">Department Overview</h1>
                    <p className="text-surface-500 mt-1">Holistic view of departmental health and aggregations.</p>
                </div>

                {isLoading ? (
                    <p className="text-surface-500 text-sm">Loading insights...</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card hover className="animate-slide-up border-t-4 border-t-primary-500">
                            <div className="flex flex-col items-center p-6 text-center">
                                <div className="p-4 rounded-full bg-primary-50 text-primary-600 mb-4">
                                    <HiOutlineUserGroup className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-surface-900">Student Enrollment</h3>
                                <p className="text-4xl font-extrabold text-primary-600 my-2">
                                    {dashboard?.stats?.total_students || 0}
                                </p>
                                <p className="text-sm text-surface-500">Active students in department</p>
                            </div>
                        </Card>

                        <Card hover className="animate-slide-up border-t-4 border-t-accent-500 transition-delay-[100ms]">
                            <div className="flex flex-col items-center p-6 text-center">
                                <div className="p-4 rounded-full bg-accent-50 text-accent-600 mb-4">
                                    <HiOutlineAcademicCap className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-surface-900">Faculty Count</h3>
                                <p className="text-4xl font-extrabold text-accent-600 my-2">
                                    {dashboard?.stats?.total_staff || 0}
                                </p>
                                <p className="text-sm text-surface-500">Total active teaching staff</p>
                            </div>
                        </Card>

                        <Card hover className="animate-slide-up border-t-4 border-t-amber-500 transition-delay-[200ms]">
                            <div className="flex flex-col items-center p-6 text-center">
                                <div className="p-4 rounded-full bg-amber-50 text-amber-600 mb-4">
                                    <HiOutlineDocumentChartBar className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-surface-900">Active Subjects</h3>
                                <p className="text-4xl font-extrabold text-amber-600 my-2">
                                    {dashboard?.stats?.total_subjects || 0}
                                </p>
                                <p className="text-sm text-surface-500">Curriculum subjects mapped</p>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Placeholder for future charting component integration */}
                <Card className="min-h-[300px] flex items-center justify-center border-dashed">
                    <div className="text-center">
                        <div className="inline-flex p-3 rounded-xl bg-surface-100 text-surface-400 mb-3">
                            <HiOutlineDocumentChartBar className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-medium text-surface-900">Advanced Analytics Available in Enterprise</h3>
                        <p className="text-sm text-surface-500 mt-1 max-w-sm mx-auto">
                            Visual charts, progression graphs, and deep-dive analytics are unlocked via a custom reporting module.
                        </p>
                    </div>
                </Card>
            </div>
        </PageWrapper>
    );
}
