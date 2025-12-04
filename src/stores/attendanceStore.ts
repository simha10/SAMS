import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AttendanceRecord } from '@/types';

interface AttendanceState {
    todayAttendance: {
        date: string;
        attendance: AttendanceRecord | null;
    } | null;
    setTodayAttendance: (data: { date: string; attendance: AttendanceRecord | null } | null) => void;
    clearTodayAttendance: () => void;
}

export const useAttendanceStore = create<AttendanceState>()(
    persist(
        (set) => ({
            todayAttendance: null,
            setTodayAttendance: (data) => {
                console.log("=== ATTENDANCE STORE SET TODAY ATTENDANCE ===");
                console.log("Data:", data);
                console.log("Timestamp:", new Date().toISOString());
                set({ todayAttendance: data });
                console.log("=== END ATTENDANCE STORE SET TODAY ATTENDANCE ===");
            },
            clearTodayAttendance: () => {
                console.log("=== ATTENDANCE STORE CLEAR TODAY ATTENDANCE ===");
                console.log("Timestamp:", new Date().toISOString());
                set({ todayAttendance: null });
                console.log("=== END ATTENDANCE STORE CLEAR TODAY ATTENDANCE ===");
            },
        }),
        {
            name: 'attendance-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                todayAttendance: state.todayAttendance,
            }),
            onRehydrateStorage: () => {
                console.log("=== ATTENDANCE STORE REHYDRATION START ===");
                return (state, error) => {
                    if (error) {
                        console.error("=== ATTENDANCE STORE REHYDRATION ERROR ===");
                        console.error("Error:", error);
                    } else {
                        console.log("=== ATTENDANCE STORE REHYDRATION COMPLETE ===");
                        console.log("State:", state);
                    }
                };
            },
        }
    )
);