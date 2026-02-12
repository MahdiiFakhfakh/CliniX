
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  HiCheckCircle,
  HiChevronLeft,
  HiChevronRight,
  HiClipboardList,
  HiCog,
  HiDotsVertical,
  HiLocationMarker,
  HiMail,
  HiMenu,
  HiOfficeBuilding,
  HiPlus,
  HiQuestionMarkCircle,
  HiSearch,
  HiUserCircle,
  HiX,
} from "react-icons/hi";

const VIEW_MODES = ["Day", "Week", "Month", "Agenda"];
const STATUS_OPTIONS = ["scheduled", "confirmed", "completed", "canceled"];
const APPOINTMENT_TYPES = [
  "consultation",
  "follow-up",
  "checkup",
  "procedure",
  "telehealth",
];

const LAYERS = [
  { id: "appointments", label: "Appointments", color: "#3b82f6" },
  { id: "procedures", label: "Procedures", color: "#8b5cf6" },
  { id: "oncall", label: "On-call Blocks", color: "#f59e0b" },
  { id: "personal", label: "Personal Blocks", color: "#10b981" },
  { id: "tasks", label: "Tasks/Reminders", color: "#ef4444" },
];

const RIGHT_TOOLS = [
  { id: "notes", label: "Notes", icon: HiClipboardList },
  { id: "tasks", label: "Tasks", icon: HiCheckCircle },
  { id: "messages", label: "Messages", icon: HiMail },
  { id: "patients", label: "Patient List", icon: HiUserCircle },
  { id: "map", label: "Map", icon: HiLocationMarker },
];

const DAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const formatDateKey = (date) => {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const parseDateKey = (dateKey) => {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const startOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const startOfWeek = (date, weekStart = 0) => {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = (day - weekStart + 7) % 7;
  return addDays(d, -diff);
};

const getWeekDays = (date, weekStart = 0) => {
  const start = startOfWeek(date, weekStart);
  return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
};

const getMonthGrid = (date, weekStart = 0) => {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const start = startOfWeek(first, weekStart);
  return Array.from({ length: 42 }).map((_, i) => addDays(start, i));
};

const to12Hour = (minutes) => {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const suffix = hrs >= 12 ? "PM" : "AM";
  const displayHour = hrs % 12 === 0 ? 12 : hrs % 12;
  return `${displayHour}:${`${mins}`.padStart(2, "0")} ${suffix}`;
};

const parseHHMM = (value) => {
  const [h, m] = (value || "00:00").split(":").map(Number);
  return h * 60 + m;
};

const toHHMM = (minutes) => {
  const normalized = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = `${Math.floor(normalized / 60)}`.padStart(2, "0");
  const m = `${normalized % 60}`.padStart(2, "0");
  return `${h}:${m}`;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const snap = (value, step) => Math.round(value / step) * step;

const eventColorClass = (event) => {
  if (event.layerId === "procedures") return "bg-violet-500 border-violet-600";
  if (event.layerId === "oncall") return "bg-amber-500 border-amber-600";
  if (event.layerId === "personal") return "bg-emerald-500 border-emerald-600";
  if (event.layerId === "tasks") return "bg-rose-500 border-rose-600";
  if (event.status === "completed") return "bg-green-600 border-green-700";
  if (event.status === "canceled") return "bg-gray-500 border-gray-600";
  return "bg-blue-600 border-blue-700";
};

const computeOverlapLayout = (events) => {
  const sorted = [...events].sort((a, b) => a.start - b.start || a.end - b.end);
  const output = [];
  const groups = [];

  sorted.forEach((event) => {
    let placed = false;
    for (let i = 0; i < groups.length; i += 1) {
      if (event.start < groups[i].maxEnd) {
        groups[i].events.push(event);
        groups[i].maxEnd = Math.max(groups[i].maxEnd, event.end);
        placed = true;
        break;
      }
    }
    if (!placed) groups.push({ events: [event], maxEnd: event.end });
  });

  groups.forEach((group) => {
    const columns = [];
    group.events.forEach((event) => {
      let col = columns.findIndex((end) => event.start >= end);
      if (col === -1) {
        col = columns.length;
        columns.push(event.end);
      } else {
        columns[col] = event.end;
      }
      output.push({ ...event, overlapIndex: col, overlapColumns: columns.length });
    });
  });

  return output;
};

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentViewMode, setCurrentViewMode] = useState("Day");
  const [weekStart, setWeekStart] = useState("sunday");
  const [workingHoursStart, setWorkingHoursStart] = useState("07:00");
  const [workingHoursEnd, setWorkingHoursEnd] = useState("23:00");
  const [slotSizeMinutes, setSlotSizeMinutes] = useState(15);
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  );
  const [weekendVisible, setWeekendVisible] = useState(true);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState("");
  const [rightTools, setRightTools] = useState(RIGHT_TOOLS);

  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [roomFilter, setRoomFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState([]);
  const [statusFilter, setStatusFilter] = useState(STATUS_OPTIONS);
  const [visibleLayers, setVisibleLayers] = useState(LAYERS.map((layer) => layer.id));

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchPeople, setSearchPeople] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [miniMonthDate, setMiniMonthDate] = useState(new Date());

  const [eventPopover, setEventPopover] = useState({
    open: false,
    eventId: "",
    x: 0,
    y: 0,
  });
  const [editorModal, setEditorModal] = useState({ open: false, event: null });
  const [newAppointmentModal, setNewAppointmentModal] = useState(false);
  const [quickCreate, setQuickCreate] = useState({
    open: false,
    start: 0,
    end: 0,
    draftDate: "",
  });
  const [dragState, setDragState] = useState({ active: false });

  const gridRef = useRef(null);
  const gridBodyRef = useRef(null);

  const weekStartIndex = weekStart === "monday" ? 1 : 0;
  const selectedDateKey = formatDateKey(selectedDate);
  const todayKey = formatDateKey(new Date());

  const workingStart = useMemo(() => parseHHMM(workingHoursStart), [workingHoursStart]);
  const workingEnd = useMemo(() => parseHHMM(workingHoursEnd), [workingHoursEnd]);
  const totalMinutes = Math.max(slotSizeMinutes, workingEnd - workingStart);
  const pixelsPerMinute = 1.1;
  const gridHeight = totalMinutes * pixelsPerMinute;

  const weekDays = useMemo(
    () => getWeekDays(selectedDate, weekStartIndex),
    [selectedDate, weekStartIndex],
  );

  const weekDateKeys = useMemo(
    () => weekDays.map((date) => formatDateKey(date)),
    [weekDays],
  );

  const monthDays = useMemo(
    () => getMonthGrid(selectedDate, weekStartIndex),
    [selectedDate, weekStartIndex],
  );

  const miniDates = useMemo(
    () => getMonthGrid(miniMonthDate, weekStartIndex),
    [miniMonthDate, weekStartIndex],
  );

  const hourTicks = useMemo(() => {
    const ticks = [];
    for (let m = workingStart; m <= workingEnd; m += 60) ticks.push(m);
    return ticks;
  }, [workingStart, workingEnd]);

  const slotTicks = useMemo(() => {
    const ticks = [];
    for (let m = workingStart; m <= workingEnd; m += slotSizeMinutes) ticks.push(m);
    return ticks;
  }, [workingStart, workingEnd, slotSizeMinutes]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [doctorsRes, appointmentsRes] = await Promise.all([
          axios.get("http://localhost:5000/api/doctors"),
          axios.get("http://localhost:5000/api/appointments"),
        ]);

        const doctorsData = doctorsRes.data?.data || [];
        setDoctors(doctorsData);
        if (doctorsData[0]) setSelectedDoctor(doctorsData[0]._id);

        const mapped = (appointmentsRes.data?.data || []).map((appt) => {
          const dateObj = new Date(appt.date);
          const [h, m] = (appt.time || "09:00").split(":").map(Number);
          const start = h * 60 + m;
          const duration = Number(appt.duration) || 30;

          return {
            id: appt._id,
            dateKey: formatDateKey(dateObj),
            start,
            end: start + duration,
            title: appt.patient?.fullName || appt.reason || "Appointment",
            reason: appt.reason || "Consultation",
            status: appt.status === "cancelled" ? "canceled" : appt.status || "scheduled",
            doctorId: appt.doctor?._id || "",
            roomId: "Room 1",
            type: appt.type || "consultation",
            layerId: "appointments",
            telehealth: appt.type === "video",
          };
        });

        setAppointments(mapped);
      } catch (error) {
        console.error("Failed to load schedule data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const baseFilteredAppointments = useMemo(() => {
    return appointments.filter((event) => {
      const doctorMatch = !selectedDoctor || event.doctorId === selectedDoctor;
      const roomMatch = roomFilter === "all" || event.roomId === roomFilter;
      const typeMatch = typeFilter.length === 0 || typeFilter.includes(event.type);
      const statusMatch = statusFilter.includes(event.status);
      const layerMatch = visibleLayers.includes(event.layerId);
      const searchMatch =
        !searchQuery ||
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.roomId.toLowerCase().includes(searchQuery.toLowerCase());

      return doctorMatch && roomMatch && typeMatch && statusMatch && layerMatch && searchMatch;
    });
  }, [
    appointments,
    roomFilter,
    searchQuery,
    selectedDoctor,
    statusFilter,
    typeFilter,
    visibleLayers,
  ]);

  const dayAppointments = useMemo(
    () =>
      computeOverlapLayout(
        baseFilteredAppointments.filter((event) => event.dateKey === selectedDateKey),
      ),
    [baseFilteredAppointments, selectedDateKey],
  );

  const weekAppointments = useMemo(() => {
    const weekSet = new Set(weekDateKeys);
    return baseFilteredAppointments.filter((event) => weekSet.has(event.dateKey));
  }, [baseFilteredAppointments, weekDateKeys]);

  const weekAppointmentsByDay = useMemo(() => {
    const grouped = {};
    weekDateKeys.forEach((key) => {
      grouped[key] = [];
    });

    weekAppointments.forEach((event) => {
      if (grouped[event.dateKey]) grouped[event.dateKey].push(event);
    });

    Object.keys(grouped).forEach((key) => {
      grouped[key] = computeOverlapLayout(grouped[key]);
    });

    return grouped;
  }, [weekAppointments, weekDateKeys]);

  const monthAppointmentsByDay = useMemo(() => {
    const map = {};
    baseFilteredAppointments.forEach((event) => {
      if (!map[event.dateKey]) map[event.dateKey] = [];
      map[event.dateKey].push(event);
    });

    Object.keys(map).forEach((dateKey) => {
      map[dateKey].sort((a, b) => a.start - b.start);
    });

    return map;
  }, [baseFilteredAppointments]);

  const currentTimeMinutes = (() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  })();

  const scrollToCurrentTime = useCallback(() => {
    if (!gridRef.current) return;

    const shouldScroll =
      currentViewMode === "Day"
        ? selectedDateKey === todayKey
        : currentViewMode === "Week"
          ? weekDateKeys.includes(todayKey)
          : false;

    if (!shouldScroll) return;

    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const fromStart = clamp(mins - workingStart, 0, totalMinutes);
    gridRef.current.scrollTop = Math.max(fromStart * pixelsPerMinute - 120, 0);
  }, [
    currentViewMode,
    pixelsPerMinute,
    selectedDateKey,
    todayKey,
    totalMinutes,
    weekDateKeys,
    workingStart,
  ]);

  useEffect(() => {
    scrollToCurrentTime();
  }, [scrollToCurrentTime]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (gridBodyRef.current) gridBodyRef.current.dataset.tick = `${Date.now()}`;
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const shiftPeriod = (delta) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      if (currentViewMode === "Month") {
        next.setMonth(next.getMonth() + delta);
      } else if (currentViewMode === "Week") {
        next.setDate(next.getDate() + delta * 7);
      } else {
        next.setDate(next.getDate() + delta);
      }
      return next;
    });
  };

  const jumpToday = () => {
    const now = new Date();
    setSelectedDate(now);
    setMiniMonthDate(now);
    scrollToCurrentTime();
  };

  const headerLabel = useMemo(() => {
    if (currentViewMode === "Month") {
      return selectedDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    }

    if (currentViewMode === "Week") {
      const start = weekDays[0];
      const end = weekDays[6];
      const startLabel = start.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const endLabel = end.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      return `${startLabel} - ${endLabel}`;
    }

    return selectedDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [currentViewMode, selectedDate, weekDays]);

  const updateEventTimes = useCallback((eventId, nextStart, nextEnd) => {
    setAppointments((prev) =>
      prev.map((event) =>
        event.id === eventId ? { ...event, start: nextStart, end: nextEnd } : event,
      ),
    );
  }, []);

  const beginMove = (event, pointerY) => {
    setDragState({
      active: true,
      type: "move",
      eventId: event.id,
      duration: event.end - event.start,
      pointerOffset: pointerY - (event.start - workingStart) * pixelsPerMinute,
      previewStart: event.start,
      previewEnd: event.end,
    });
  };

  const beginResize = (event, edge) => {
    setDragState({
      active: true,
      type: edge === "start" ? "resize-start" : "resize-end",
      eventId: event.id,
      previewStart: event.start,
      previewEnd: event.end,
    });
  };

  const beginCreate = (clientY) => {
    if (!gridRef.current || currentViewMode !== "Day") return;

    const rect = gridRef.current.getBoundingClientRect();
    const y = clientY - rect.top + gridRef.current.scrollTop;
    const minute = clamp(
      snap(workingStart + y / pixelsPerMinute, slotSizeMinutes),
      workingStart,
      workingEnd - slotSizeMinutes,
    );

    setDragState({
      active: true,
      type: "create",
      startMinute: minute,
      currentMinute: minute + slotSizeMinutes,
    });
  };

  useEffect(() => {
    if (!dragState.active || currentViewMode !== "Day") return undefined;

    const handleMove = (e) => {
      if (!gridRef.current) return;
      const rect = gridRef.current.getBoundingClientRect();
      const y = e.clientY - rect.top + gridRef.current.scrollTop;
      const minute = clamp(
        snap(workingStart + y / pixelsPerMinute, slotSizeMinutes),
        workingStart,
        workingEnd,
      );

      if (e.clientY > rect.bottom - 50) gridRef.current.scrollTop += 16;
      if (e.clientY < rect.top + 50) gridRef.current.scrollTop -= 16;

      if (dragState.type === "create") {
        setDragState((prev) => ({
          ...prev,
          currentMinute: clamp(minute, workingStart + slotSizeMinutes, workingEnd),
        }));
        return;
      }

      if (dragState.type === "move") {
        const newStart = clamp(
          snap(workingStart + (y - dragState.pointerOffset) / pixelsPerMinute, slotSizeMinutes),
          workingStart,
          workingEnd - dragState.duration,
        );
        setDragState((prev) => ({
          ...prev,
          previewStart: newStart,
          previewEnd: newStart + dragState.duration,
        }));
      }

      if (dragState.type === "resize-start") {
        const newStart = clamp(
          snap(minute, slotSizeMinutes),
          workingStart,
          dragState.previewEnd - slotSizeMinutes,
        );
        setDragState((prev) => ({ ...prev, previewStart: newStart }));
      }

      if (dragState.type === "resize-end") {
        const newEnd = clamp(
          snap(minute, slotSizeMinutes),
          dragState.previewStart + slotSizeMinutes,
          workingEnd,
        );
        setDragState((prev) => ({ ...prev, previewEnd: newEnd }));
      }
    };

    const handleUp = () => {
      if (dragState.type === "create") {
        const start = Math.min(dragState.startMinute, dragState.currentMinute);
        const end = Math.max(dragState.startMinute, dragState.currentMinute);
        setQuickCreate({ open: true, start, end, draftDate: selectedDateKey });
      } else {
        updateEventTimes(dragState.eventId, dragState.previewStart, dragState.previewEnd);
      }
      setDragState({ active: false });
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [
    currentViewMode,
    dragState,
    pixelsPerMinute,
    selectedDateKey,
    slotSizeMinutes,
    updateEventTimes,
    workingEnd,
    workingStart,
  ]);

  const toggleTypeFilter = (type) => {
    setTypeFilter((prev) =>
      prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type],
    );
  };

  const toggleStatusFilter = (status) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((item) => item !== status) : [...prev, status],
    );
  };

  const toggleLayer = (layerId) => {
    setVisibleLayers((prev) =>
      prev.includes(layerId) ? prev.filter((id) => id !== layerId) : [...prev, layerId],
    );
  };

  const quickCreateSubmit = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const title = form.get("title")?.toString().trim() || "New appointment";
    const reason = form.get("reason")?.toString().trim() || "Consultation";
    const status = form.get("status")?.toString() || "scheduled";
    const type = form.get("type")?.toString() || "consultation";
    const roomId = form.get("room")?.toString() || "Room 1";

    setAppointments((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        dateKey: quickCreate.draftDate,
        start: quickCreate.start,
        end: quickCreate.end,
        title,
        reason,
        status,
        doctorId: selectedDoctor,
        roomId,
        type,
        layerId: "appointments",
        telehealth: type === "telehealth",
      },
    ]);

    setQuickCreate({ open: false, start: 0, end: 0, draftDate: "" });
  };

  const openEditor = (event) => {
    setEditorModal({ open: true, event: { ...event } });
    setEventPopover({ open: false, eventId: "", x: 0, y: 0 });
  };

  const saveEditor = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const nextEvent = {
      ...editorModal.event,
      title: form.get("title")?.toString() || editorModal.event.title,
      reason: form.get("reason")?.toString() || editorModal.event.reason,
      roomId: form.get("roomId")?.toString() || editorModal.event.roomId,
      status: form.get("status")?.toString() || editorModal.event.status,
      type: form.get("type")?.toString() || editorModal.event.type,
      start: parseHHMM(form.get("start")?.toString() || toHHMM(editorModal.event.start)),
      end: parseHHMM(form.get("end")?.toString() || toHHMM(editorModal.event.end)),
    };

    if (nextEvent.end <= nextEvent.start) {
      nextEvent.end = nextEvent.start + slotSizeMinutes;
    }

    setAppointments((prev) =>
      prev.map((event) => (event.id === nextEvent.id ? nextEvent : event)),
    );
    setEditorModal({ open: false, event: null });
  };

  const eventById = useMemo(() => {
    const map = {};
    appointments.forEach((event) => {
      map[event.id] = event;
    });
    return map;
  }, [appointments]);

  const activeEvent = eventById[eventPopover.eventId];

  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || e.target?.isContentEditable) return;

      if (e.key === "Escape") {
        setHelpOpen(false);
        setSettingsOpen(false);
        setProfileOpen(false);
        setDatePickerOpen(false);
        setEventPopover({ open: false, eventId: "", x: 0, y: 0 });
        setEditorModal({ open: false, event: null });
        setQuickCreate({ open: false, start: 0, end: 0, draftDate: "" });
      }

      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        setNewAppointmentModal(true);
      }

      if (e.key.toLowerCase() === "t") {
        e.preventDefault();
        jumpToday();
      }

      if (e.key.toLowerCase() === "d") setCurrentViewMode("Day");
      if (e.key.toLowerCase() === "w") setCurrentViewMode("Week");
      if (e.key.toLowerCase() === "m") setCurrentViewMode("Month");
      if (e.key.toLowerCase() === "a") setCurrentViewMode("Agenda");

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        shiftPeriod(-1);
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        shiftPeriod(1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <p className="text-gray-500 text-lg animate-pulse">Loading schedule...</p>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-112px)] min-h-[760px] w-full bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
      <div className="h-16 px-4 border-b border-slate-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-700"
            aria-label="Toggle sidebar"
          >
            <HiMenu className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedDate(new Date());
              setCurrentViewMode("Day");
            }}
            className="font-semibold text-slate-900"
          >
            Clinix Schedule
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={jumpToday}
            className="px-4 py-1.5 rounded-full border border-slate-300 text-sm font-medium hover:bg-slate-50"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => shiftPeriod(-1)}
            className="p-2 rounded-full hover:bg-slate-100"
            aria-label="Previous period"
          >
            <HiChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => shiftPeriod(1)}
            className="p-2 rounded-full hover:bg-slate-100"
            aria-label="Next period"
          >
            <HiChevronRight className="w-5 h-5" />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setDatePickerOpen((prev) => !prev)}
              className="px-3 py-1.5 rounded-lg hover:bg-slate-100 font-medium text-slate-800"
            >
              {headerLabel}
            </button>
            {datePickerOpen && (
              <div className="absolute z-40 mt-2 p-3 rounded-xl bg-white border border-slate-200 shadow-lg">
                <input
                  type="date"
                  value={selectedDateKey}
                  onChange={(e) => {
                    const next = new Date(e.target.value);
                    if (!Number.isNaN(next.getTime())) {
                      setSelectedDate(next);
                      setMiniMonthDate(next);
                    }
                    setDatePickerOpen(false);
                  }}
                  className="border border-slate-300 rounded-lg px-2 py-1"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {searchOpen && (
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patient, reason, room"
              className="w-64 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
            />
          )}
          <button
            type="button"
            onClick={() => setSearchOpen((prev) => !prev)}
            className="p-2 rounded-full hover:bg-slate-100"
            aria-label="Search"
          >
            <HiSearch className="w-5 h-5" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setHelpOpen((prev) => !prev)}
              className="p-2 rounded-full hover:bg-slate-100"
              aria-label="Help"
            >
              <HiQuestionMarkCircle className="w-5 h-5" />
            </button>
            {helpOpen && (
              <div className="absolute right-0 z-40 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-lg p-3">
                <p className="text-sm font-semibold text-slate-900">Clinix Tips</p>
                <ul className="text-xs text-slate-600 mt-2 space-y-1">
                  <li>N: New appointment</li>
                  <li>T: Jump to today</li>
                  <li>D/W/M/A: switch view</li>
                  <li>Arrow keys: previous/next period</li>
                  <li>Esc: close open panels</li>
                </ul>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setSettingsOpen((prev) => !prev)}
            className="p-2 rounded-full hover:bg-slate-100"
            aria-label="Settings"
          >
            <HiCog className="w-5 h-5" />
          </button>

          <select
            value={currentViewMode}
            onChange={(e) => setCurrentViewMode(e.target.value)}
            className="border border-slate-300 rounded-full px-3 py-1.5 text-sm bg-white"
          >
            {VIEW_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>

          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              className="p-1 rounded-full hover:bg-slate-100"
              aria-label="User profile"
            >
              <HiUserCircle className="w-8 h-8 text-slate-700" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 z-40 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-2 text-sm">
                <button type="button" className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100">Profile</button>
                <button type="button" className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100">Switch Clinic</button>
                <button type="button" className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 text-red-600">Logout</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100%-64px)]">
        {!sidebarCollapsed && (
          <aside className="w-72 shrink-0 border-r border-slate-200 bg-white overflow-y-auto p-4 space-y-4">
            <button type="button" onClick={() => setNewAppointmentModal(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-black text-white hover:bg-slate-800"><HiPlus className="w-5 h-5" />New Appointment</button>

            <div className="border border-slate-200 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <button type="button" className="p-1 rounded hover:bg-slate-100" onClick={() => { const next = new Date(miniMonthDate); next.setMonth(next.getMonth() - 1); setMiniMonthDate(next); }}><HiChevronLeft className="w-4 h-4" /></button>
                <p className="text-sm font-semibold">{miniMonthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
                <button type="button" className="p-1 rounded hover:bg-slate-100" onClick={() => { const next = new Date(miniMonthDate); next.setMonth(next.getMonth() + 1); setMiniMonthDate(next); }}><HiChevronRight className="w-4 h-4" /></button>
              </div>

              <div className="grid grid-cols-7 text-[10px] text-center text-slate-500 mb-1">{DAY_NAMES_SHORT.map((day) => (<span key={day}>{day[0]}</span>))}</div>
              <div className="grid grid-cols-7 gap-1 text-xs">
                {miniDates.map((day) => {
                  const isCurrentMonth = day.getMonth() === miniMonthDate.getMonth();
                  const isSelected = formatDateKey(day) === selectedDateKey;
                  const isToday = formatDateKey(day) === todayKey;
                  return (
                    <button key={day.getTime()} type="button" onClick={() => setSelectedDate(new Date(day))} className={`h-7 rounded-full transition ${isSelected ? "bg-blue-600 text-white" : isToday ? "border border-blue-400 text-blue-700" : isCurrentMonth ? "hover:bg-slate-100 text-slate-700" : "text-slate-300"}`}>{day.getDate()}</button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <input type="text" value={searchPeople} onChange={(e) => setSearchPeople(e.target.value)} placeholder="Search staff/patient" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />

              <div><label className="block text-xs font-semibold text-slate-600 mb-1">Doctor</label><select value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)} className="w-full border border-slate-300 rounded-lg px-2 py-2 text-sm">{doctors.map((doc) => (<option key={doc._id} value={doc._id}>Dr. {doc.fullName}</option>))}</select></div>

              <div><label className="block text-xs font-semibold text-slate-600 mb-1">Room</label><select value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)} className="w-full border border-slate-300 rounded-lg px-2 py-2 text-sm"><option value="all">All rooms</option><option value="Room 1">Room 1</option><option value="Room 2">Room 2</option><option value="Telehealth">Telehealth</option></select></div>

              <div><p className="text-xs font-semibold text-slate-600 mb-1">Appointment Type</p><div className="flex flex-wrap gap-1">{APPOINTMENT_TYPES.map((type) => (<button key={type} type="button" onClick={() => toggleTypeFilter(type)} className={`px-2 py-1 text-xs rounded-full border ${typeFilter.includes(type) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-300"}`}>{type}</button>))}</div></div>

              <div><p className="text-xs font-semibold text-slate-600 mb-1">Status</p><div className="flex flex-wrap gap-1">{STATUS_OPTIONS.map((status) => (<button key={status} type="button" onClick={() => toggleStatusFilter(status)} className={`px-2 py-1 text-xs rounded-full border ${statusFilter.includes(status) ? "bg-slate-700 text-white border-slate-700" : "bg-white text-slate-600 border-slate-300"}`}>{status}</button>))}</div></div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Calendars / Layers</p>
              <div className="space-y-2">{LAYERS.map((layer) => (<div key={layer.id} className="flex items-center justify-between group"><label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={visibleLayers.includes(layer.id)} onChange={() => toggleLayer(layer.id)} /><span className="w-3 h-3 rounded-full" style={{ backgroundColor: layer.color }} />{layer.label}</label><button type="button" className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-100"><HiDotsVertical className="w-4 h-4 text-slate-500" /></button></div>))}</div>
            </div>
          </aside>
        )}

        <main className="flex-1 relative bg-slate-50">
          <div className="h-full flex">
            <div className="flex-1 relative">
              {currentViewMode === "Day" && (
                <div className="h-full flex flex-col">
                  <div className="h-14 border-b border-slate-200 bg-white flex items-center px-6">
                    <div className="w-20" />
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">{selectedDate.toLocaleDateString("en-US", { weekday: "short" })}</p>
                      <div className="flex items-center gap-2"><p className="text-xl font-semibold text-slate-800">{selectedDate.getDate()}</p>{selectedDateKey === todayKey && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Today</span>}</div>
                    </div>
                    <div className="ml-auto text-xs text-slate-500">{timezone}</div>
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <div ref={gridRef} className="h-full overflow-auto" onMouseDown={(e) => { if (e.target.dataset.gridCell === "true") beginCreate(e.clientY); }}>
                      <div className="relative flex" style={{ minHeight: gridHeight + 40 }}>
                        <div className="w-20 shrink-0 border-r border-slate-200 bg-white">{hourTicks.map((minute) => (<div key={`hour-${minute}`} className="text-xs text-slate-500 pr-2 text-right" style={{ height: 60 * pixelsPerMinute }}>{to12Hour(minute).replace(":00", "")}</div>))}</div>

                        <div ref={gridBodyRef} className="flex-1 relative bg-white">
                          {slotTicks.map((minute) => (<div key={`slot-${minute}`} data-grid-cell="true" className={`absolute left-0 right-0 border-t ${minute % 60 === 0 ? "border-slate-300" : "border-slate-100"}`} style={{ top: (minute - workingStart) * pixelsPerMinute }} />))}

                          {selectedDateKey === todayKey && currentTimeMinutes >= workingStart && currentTimeMinutes <= workingEnd && (
                            <div className="absolute left-0 right-0 z-30" style={{ top: (currentTimeMinutes - workingStart) * pixelsPerMinute }}><div className="absolute -left-1.5 w-3 h-3 rounded-full bg-red-500" /><div className="h-0.5 bg-red-500" /></div>
                          )}

                          {dragState.active && dragState.type === "create" && (<div className="absolute left-1 right-1 rounded-lg border border-dashed border-blue-400 bg-blue-100/60 z-20" style={{ top: (Math.min(dragState.startMinute, dragState.currentMinute) - workingStart) * pixelsPerMinute, height: (Math.max(dragState.startMinute, dragState.currentMinute) - Math.min(dragState.startMinute, dragState.currentMinute)) * pixelsPerMinute }} />)}

                          {dayAppointments.map((event) => {
                            const isDragging = dragState.active && dragState.eventId === event.id;
                            const renderStart = isDragging ? dragState.previewStart : event.start;
                            const renderEnd = isDragging ? dragState.previewEnd : event.end;
                            const left = (event.overlapIndex / event.overlapColumns) * 100;
                            const width = 100 / event.overlapColumns;

                            return (
                              <div key={event.id} role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); setEventPopover({ open: true, eventId: event.id, x: e.clientX, y: e.clientY }); }} onDoubleClick={() => openEditor(event)} onMouseDown={(e) => { if (e.target.dataset.resizeHandle) return; beginMove(event, e.clientY); }} className={`absolute z-20 text-white rounded-lg border px-2 py-1 text-xs shadow-sm cursor-grab hover:shadow-md ${eventColorClass(event)}`} style={{ top: (renderStart - workingStart) * pixelsPerMinute, height: Math.max((renderEnd - renderStart) * pixelsPerMinute, 24), left: `calc(${left}% + 4px)`, width: `calc(${width}% - 8px)` }}>
                                <div data-resize-handle="start" onMouseDown={(e) => { e.stopPropagation(); beginResize(event, "start"); }} className="absolute top-0 left-0 right-0 h-1.5 cursor-ns-resize" />
                                <div className="font-semibold truncate">{event.title}</div>
                                <div className="opacity-90">{to12Hour(renderStart)} - {to12Hour(renderEnd)}</div>
                                <div className="opacity-90 flex items-center gap-1 mt-0.5"><HiOfficeBuilding className="w-3 h-3" /><span className="truncate">{event.roomId}</span>{event.telehealth && <span>- Telehealth</span>}</div>
                                <div data-resize-handle="end" onMouseDown={(e) => { e.stopPropagation(); beginResize(event, "end"); }} className="absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize" />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentViewMode === "Week" && (
                <div className="h-full flex flex-col">
                  <div className="h-14 border-b border-slate-200 bg-white grid grid-cols-[80px_repeat(7,minmax(0,1fr))]">
                    <div />
                    {weekDays.filter((date) => weekendVisible || (date.getDay() !== 0 && date.getDay() !== 6)).map((day) => {
                      const dayKey = formatDateKey(day);
                      const isToday = dayKey === todayKey;
                      return <div key={dayKey} className="px-2 flex flex-col justify-center border-l border-slate-200"><p className="text-[11px] uppercase text-slate-500">{DAY_NAMES_SHORT[day.getDay()]}</p><p className={`text-lg font-semibold ${isToday ? "text-blue-700" : "text-slate-800"}`}>{day.getDate()}</p></div>;
                    })}
                  </div>

                  <div ref={gridRef} className="flex-1 overflow-auto">
                    <div className="relative grid grid-cols-[80px_repeat(7,minmax(0,1fr))] bg-white" style={{ minHeight: gridHeight + 30 }}>
                      <div className="border-r border-slate-200">{hourTicks.map((minute) => (<div key={`wh-${minute}`} className="text-xs text-slate-500 pr-2 text-right" style={{ height: 60 * pixelsPerMinute }}>{to12Hour(minute).replace(":00", "")}</div>))}</div>

                      {weekDays.filter((date) => weekendVisible || (date.getDay() !== 0 && date.getDay() !== 6)).map((day) => {
                        const dayKey = formatDateKey(day);
                        const dayEvents = weekAppointmentsByDay[dayKey] || [];
                        return (
                          <div key={`week-col-${dayKey}`} className="relative border-l border-slate-200" style={{ minHeight: gridHeight + 30 }}>
                            {slotTicks.map((minute) => (<div key={`week-slot-${dayKey}-${minute}`} className={`absolute left-0 right-0 border-t ${minute % 60 === 0 ? "border-slate-300" : "border-slate-100"}`} style={{ top: (minute - workingStart) * pixelsPerMinute }} />))}

                            {dayKey === todayKey && currentTimeMinutes >= workingStart && currentTimeMinutes <= workingEnd && (<div className="absolute left-0 right-0 z-30" style={{ top: (currentTimeMinutes - workingStart) * pixelsPerMinute }}><div className="h-0.5 bg-red-500" /></div>)}

                            {dayEvents.map((event) => {
                              const left = (event.overlapIndex / event.overlapColumns) * 100;
                              const width = 100 / event.overlapColumns;
                              return (
                                <div key={`week-event-${event.id}`} className={`absolute z-20 text-white rounded-lg border px-2 py-1 text-xs shadow-sm ${eventColorClass(event)}`} style={{ top: (event.start - workingStart) * pixelsPerMinute, height: Math.max((event.end - event.start) * pixelsPerMinute, 24), left: `calc(${left}% + 3px)`, width: `calc(${width}% - 6px)` }} onClick={(e) => { setEventPopover({ open: true, eventId: event.id, x: e.clientX, y: e.clientY }); }}>
                                  <div className="font-semibold truncate">{event.title}</div>
                                  <div className="truncate">{to12Hour(event.start)} - {to12Hour(event.end)}</div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {currentViewMode === "Month" && (
                <div className="h-full flex flex-col bg-white">
                  <div className="grid grid-cols-7 border-b border-slate-200">
                    {(weekStartIndex === 1 ? [...DAY_NAMES_SHORT.slice(1), DAY_NAMES_SHORT[0]] : DAY_NAMES_SHORT).map((label) => (<div key={`month-head-${label}`} className="px-3 py-2 text-xs font-semibold text-slate-600 border-r last:border-r-0 border-slate-200">{label.toUpperCase()}</div>))}
                  </div>

                  <div className="flex-1 grid grid-cols-7 grid-rows-6">
                    {monthDays.filter((date) => weekendVisible || (date.getDay() !== 0 && date.getDay() !== 6)).map((day) => {
                      const dateKey = formatDateKey(day);
                      const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
                      const isToday = dateKey === todayKey;
                      const dayEvents = monthAppointmentsByDay[dateKey] || [];

                      return (
                        <button key={`month-cell-${dateKey}`} type="button" className={`border-r border-b border-slate-200 px-2 py-2 text-left align-top overflow-hidden ${isCurrentMonth ? "bg-white" : "bg-slate-50"}`} onClick={() => { setSelectedDate(day); setCurrentViewMode("Day"); }}>
                          <div className="flex items-center justify-between mb-1"><span className={`text-sm ${isToday ? "w-7 h-7 rounded-full bg-blue-600 text-white inline-flex items-center justify-center" : isCurrentMonth ? "text-slate-800" : "text-slate-400"}`}>{day.getDate()}</span></div>
                          <div className="space-y-1">
                            {dayEvents.slice(0, 4).map((event) => (<div key={`month-event-${event.id}`} className="text-[11px] px-1.5 py-1 rounded-md bg-slate-100 text-slate-700 truncate" onClick={(e) => { e.stopPropagation(); setEventPopover({ open: true, eventId: event.id, x: e.clientX, y: e.clientY }); }}>{to12Hour(event.start).replace(":00", "")} {event.title}</div>))}
                            {dayEvents.length > 4 && <p className="text-[11px] text-slate-500">+{dayEvents.length - 4} more</p>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentViewMode === "Agenda" && (
                <div className="h-full overflow-y-auto bg-white p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Agenda</h3>
                  <div className="space-y-3">
                    {[...baseFilteredAppointments].sort((a, b) => (a.dateKey === b.dateKey ? a.start - b.start : a.dateKey.localeCompare(b.dateKey))).slice(0, 100).map((event) => (
                      <div key={`agenda-${event.id}`} className="border border-slate-200 rounded-xl p-3 flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{event.title}</p>
                          <p className="text-sm text-slate-600">{parseDateKey(event.dateKey).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</p>
                          <p className="text-sm text-slate-600">{to12Hour(event.start)} - {to12Hour(event.end)}</p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700 capitalize">{event.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <aside className="w-12 border-l border-slate-200 bg-white flex flex-col items-center py-2 gap-2">
              {rightTools.map((tool) => {
                const Icon = tool.icon;
                const active = rightPanelOpen === tool.id;
                return <button key={tool.id} type="button" onClick={() => setRightPanelOpen((prev) => (prev === tool.id ? "" : tool.id))} className={`p-2 rounded-lg ${active ? "bg-blue-100 text-blue-700" : "hover:bg-slate-100 text-slate-600"}`} title={tool.label}><Icon className="w-5 h-5" /></button>;
              })}
              <button type="button" onClick={() => setRightTools((prev) => [...prev, { id: `tool-${prev.length + 1}`, label: "Custom Tool", icon: HiPlus }])} className="mt-auto p-2 rounded-lg hover:bg-slate-100 text-slate-600" title="Add tool"><HiPlus className="w-5 h-5" /></button>
            </aside>

            {rightPanelOpen && (
              <div className="w-[300px] border-l border-slate-200 bg-white p-4 overflow-y-auto">
                <div className="flex items-center justify-between"><h3 className="font-semibold text-slate-900">{rightTools.find((tool) => tool.id === rightPanelOpen)?.label}</h3><button type="button" onClick={() => setRightPanelOpen("")} className="p-1 rounded hover:bg-slate-100"><HiX className="w-5 h-5" /></button></div>
                <p className="text-sm text-slate-500 mt-2">Clinix Tools panel content for {rightPanelOpen}.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {eventPopover.open && activeEvent && (
        <div className="fixed z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-64" style={{ left: eventPopover.x + 12, top: eventPopover.y + 12 }}>
          <p className="font-semibold text-slate-900">{activeEvent.title}</p>
          <p className="text-sm text-slate-600 mt-1">{to12Hour(activeEvent.start)} - {to12Hour(activeEvent.end)}</p>
          <p className="text-sm text-slate-600">{activeEvent.reason}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <button type="button" onClick={() => openEditor(activeEvent)} className="px-2 py-1 rounded border border-slate-300 hover:bg-slate-50">Edit</button>
            <button type="button" className="px-2 py-1 rounded border border-slate-300 hover:bg-slate-50" onClick={() => { setAppointments((prev) => prev.filter((event) => event.id !== activeEvent.id)); setEventPopover({ open: false, eventId: "", x: 0, y: 0 }); }}>Cancel</button>
            <button type="button" className="px-2 py-1 rounded border border-slate-300 hover:bg-slate-50" onClick={() => { setAppointments((prev) => prev.map((event) => (event.id === activeEvent.id ? { ...event, status: "confirmed" } : event))); }}>Check-In</button>
            <button type="button" className="px-2 py-1 rounded border border-slate-300 hover:bg-slate-50" onClick={() => { setAppointments((prev) => prev.map((event) => (event.id === activeEvent.id ? { ...event, status: "completed" } : event))); }}>Mark Done</button>
          </div>
        </div>
      )}

      {(settingsOpen || editorModal.open || quickCreate.open || newAppointmentModal) && <div className="fixed inset-0 bg-black/20 z-40" />}

      {settingsOpen && (
        <div className="fixed z-50 top-24 right-8 w-[360px] bg-white border border-slate-200 rounded-2xl shadow-xl p-4 space-y-3">
          <div className="flex items-center justify-between"><h3 className="font-semibold text-slate-900">Schedule Settings</h3><button type="button" onClick={() => setSettingsOpen(false)} className="p-1 rounded hover:bg-slate-100"><HiX className="w-5 h-5" /></button></div>
          <div><label className="block text-xs text-slate-600 mb-1">Default View Mode</label><select value={currentViewMode} onChange={(e) => setCurrentViewMode(e.target.value)} className="w-full border border-slate-300 rounded-lg px-2 py-2 text-sm">{VIEW_MODES.map((mode) => (<option key={mode} value={mode}>{mode}</option>))}</select></div>
          <div className="grid grid-cols-2 gap-2"><div><label className="block text-xs text-slate-600 mb-1">Work Start</label><input type="time" value={workingHoursStart} onChange={(e) => setWorkingHoursStart(e.target.value)} className="w-full border border-slate-300 rounded-lg px-2 py-2 text-sm" /></div><div><label className="block text-xs text-slate-600 mb-1">Work End</label><input type="time" value={workingHoursEnd} onChange={(e) => setWorkingHoursEnd(e.target.value)} className="w-full border border-slate-300 rounded-lg px-2 py-2 text-sm" /></div></div>
          <div><label className="block text-xs text-slate-600 mb-1">Lunch Break Template</label><input defaultValue="12:30 - 13:30" className="w-full border border-slate-300 rounded-lg px-2 py-2 text-sm" /></div>
          <div><label className="block text-xs text-slate-600 mb-1">Slot Interval</label><select value={slotSizeMinutes} onChange={(e) => setSlotSizeMinutes(Number(e.target.value))} className="w-full border border-slate-300 rounded-lg px-2 py-2 text-sm">{[5, 10, 15, 30].map((size) => (<option key={size} value={size}>{size} minutes</option>))}</select></div>
          <div><label className="block text-xs text-slate-600 mb-1">Week Start</label><select value={weekStart} onChange={(e) => setWeekStart(e.target.value)} className="w-full border border-slate-300 rounded-lg px-2 py-2 text-sm"><option value="sunday">Sunday</option><option value="monday">Monday</option></select></div>
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={weekendVisible} onChange={(e) => setWeekendVisible(e.target.checked)} />Show weekends</label>
          <div><label className="block text-xs text-slate-600 mb-1">Timezone / Clinic Location</label><input value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full border border-slate-300 rounded-lg px-2 py-2 text-sm" /></div>
          <div><label className="block text-xs text-slate-600 mb-1">Color Scheme</label><select className="w-full border border-slate-300 rounded-lg px-2 py-2 text-sm"><option>By doctor</option><option>By appointment type</option></select></div>
        </div>
      )}

      {quickCreate.open && (
        <div className="fixed z-50 top-24 left-1/2 -translate-x-1/2 w-[420px] bg-white border border-slate-200 rounded-2xl shadow-xl p-4">
          <div className="flex items-center justify-between"><h3 className="font-semibold text-slate-900">Quick Create Appointment</h3><button type="button" onClick={() => setQuickCreate({ open: false, start: 0, end: 0, draftDate: "" })}><HiX className="w-5 h-5" /></button></div>
          <p className="text-sm text-slate-500 mt-1">{to12Hour(quickCreate.start)} - {to12Hour(quickCreate.end)}</p>
          <form onSubmit={quickCreateSubmit} className="mt-3 space-y-3">
            <input name="title" placeholder="Patient name" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" required />
            <input name="reason" placeholder="Reason" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            <div className="grid grid-cols-3 gap-2"><select name="status" className="border border-slate-300 rounded-lg px-2 py-2 text-sm">{STATUS_OPTIONS.map((status) => (<option key={status} value={status}>{status}</option>))}</select><select name="type" className="border border-slate-300 rounded-lg px-2 py-2 text-sm">{APPOINTMENT_TYPES.map((type) => (<option key={type} value={type}>{type}</option>))}</select><input name="room" placeholder="Room" defaultValue="Room 1" className="border border-slate-300 rounded-lg px-2 py-2 text-sm" /></div>
            <button type="submit" className="w-full bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700">Create Appointment</button>
          </form>
        </div>
      )}

      {newAppointmentModal && (
        <div className="fixed z-50 top-24 left-1/2 -translate-x-1/2 w-[460px] bg-white border border-slate-200 rounded-2xl shadow-xl p-4">
          <div className="flex items-center justify-between"><h3 className="font-semibold">New Appointment</h3><button type="button" onClick={() => setNewAppointmentModal(false)}><HiX className="w-5 h-5" /></button></div>
          <p className="text-sm text-slate-500 mt-2">Use click-drag on the day view grid for exact times, or create quickly from here.</p>
          <button type="button" onClick={() => { setQuickCreate({ open: true, start: workingStart + 60, end: workingStart + 90, draftDate: selectedDateKey }); setNewAppointmentModal(false); }} className="mt-3 w-full py-2 rounded-lg bg-black text-white">Open Quick Create</button>
        </div>
      )}

      {editorModal.open && editorModal.event && (
        <div className="fixed z-50 top-24 left-1/2 -translate-x-1/2 w-[520px] bg-white border border-slate-200 rounded-2xl shadow-xl p-4">
          <div className="flex items-center justify-between"><h3 className="font-semibold text-slate-900">Edit Appointment</h3><button type="button" onClick={() => setEditorModal({ open: false, event: null })}><HiX className="w-5 h-5" /></button></div>
          <form className="space-y-3 mt-3" onSubmit={saveEditor}>
            <input name="title" defaultValue={editorModal.event.title} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            <input name="reason" defaultValue={editorModal.event.reason} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2"><input type="time" name="start" defaultValue={toHHMM(editorModal.event.start)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" /><input type="time" name="end" defaultValue={toHHMM(editorModal.event.end)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" /></div>
            <div className="grid grid-cols-3 gap-2"><input name="roomId" defaultValue={editorModal.event.roomId} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" /><select name="status" defaultValue={editorModal.event.status} className="border border-slate-300 rounded-lg px-2 py-2 text-sm">{STATUS_OPTIONS.map((status) => (<option key={status} value={status}>{status}</option>))}</select><select name="type" defaultValue={editorModal.event.type} className="border border-slate-300 rounded-lg px-2 py-2 text-sm">{APPOINTMENT_TYPES.map((type) => (<option key={type} value={type}>{type}</option>))}</select></div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Save Changes</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Doctors;
