import React, { useEffect, useState, useCallback } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import moment from "moment";
import axios from "axios";
import { useAtomValue } from "jotai";
import { loginIdState } from "../../utils/jotai";
import "./AttendCalendar.css";

const attendWeekDays = ["일", "월", "화", "수", "목", "금", "토"];

export default function AttendCalendar({ refreshTrigger: attendRefreshTrigger }) {
    const attendLoginId = useAtomValue(loginIdState);
    const [attendMarkDates, setAttendMarkDates] = useState([]);

    // 출석 데이터 로드 로직
    const attendLoadData = useCallback(() => {
        if (!attendLoginId) return;
        
        axios.get("/point/main/attendance/calendar")
            .then(attendResp => {
                setAttendMarkDates(attendResp.data || []);
            })
            .catch(attendErr => {
                console.error("출석 데이터 로드 실패:", attendErr);
            });
    }, [attendLoginId]);

    useEffect(() => {
        attendLoadData();
    }, [attendLoadData, attendRefreshTrigger]); 

    return (
        <div className="attendCalendarWrapper">
            <Calendar
                className="attendCustomCalendar"
                locale="ko-KR"
                calendarType="gregory"
                formatShortWeekday={(locale, date) => attendWeekDays[date.getDay()]}
                formatDay={(locale, date) => moment(date).format("D")}
                tileContent={({ date: attendDate, view: attendView }) => {
                    // 특정 날짜에 출석 기록이 있으면 도장 출력
                    if (attendView === "month" && attendMarkDates.includes(moment(attendDate).format("YYYY-MM-DD"))) {
                        return (
                            <div className="attendSmallStamp">
                                참잘<br/>했어요
                            </div>
                        );
                    }
                }}
                next2Label={null} 
                prev2Label={null}
                showNeighboringMonth={false}
            />
        </div>
    );
}