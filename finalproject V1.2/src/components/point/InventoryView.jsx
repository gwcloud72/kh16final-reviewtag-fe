import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useSetAtom } from "jotai";
import { pointRefreshAtom } from "../../utils/jotai";
import "./InventoryView.css";

const DECO_TYPES = ["DECO_NICK", "DECO_BG", "DECO_ICON", "DECO_FRAME"];

/* ===========================
   Swal Helper Functions
=========================== */

const swalConfirm = (options) =>
    Swal.fire({
        showCancelButton: true,
        background: "#1a1a1a",
        color: "#fff",
        ...options,
    });

const swalInputNick = () =>
    Swal.fire({
        title: "닉네임 변경",
        input: "text",
        inputLabel: "새로운 닉네임을 입력해주세요 (2~10자)",
        inputPlaceholder: "변경할 닉네임 입력",
        showCancelButton: true,
        confirmButtonText: "변경하기",
        cancelButtonText: "취소",
        background: "#1a1a1a",
        color: "#fff",
        inputValidator: (value) => {
            if (!value || value.length < 2 || value.length > 10) {
                return "2~10자 사이의 닉네임을 입력해야 합니다!";
            }
        },
    });

/* ===========================
   Item Type Handlers
=========================== */

const itemHandlers = {
    CHANGE_NICK: async () => {
        const { value } = await swalInputNick();
        return value || null;
    },

    HEART_RECHARGE: async (item) => {
        const result = await swalConfirm({
            title: "하트 충전",
            text: `[${item.pointItemName}]을 사용하여 하트 5개를 충전하시겠습니까?`,
            icon: "question",
            confirmButtonText: "충전하기",
            cancelButtonText: "취소",
        });
        return result.isConfirmed;
    },

    DECO: async (item) => {
        if (item.inventoryEquipped === "Y") {
            toast.info("이미 착용 중인 아이템입니다.");
            return false;
        }

        const result = await swalConfirm({
            title: "스타일 적용",
            text: `[${item.pointItemName}] 아이템을 장착하시겠습니까?`,
            icon: "question",
            confirmButtonText: "장착",
            cancelButtonText: "취소",
        });

        return result.isConfirmed;
    },

    RANDOM_ICON: async (item, refresh) => {
        const confirm = await swalConfirm({
            title: "아이콘 뽑기",
            text: "🎲 아이콘 뽑기 티켓을 사용하시겠습니까?",
            icon: "info",
            confirmButtonText: "뽑기 시작!",
            cancelButtonText: "나중에",
        });

        if (!confirm.isConfirmed) return false;

        try {
            const resp = await axios.post("/point/icon/draw", {
                inventoryNo: item.inventoryNo,
            });

            const icon = resp.data;

            await Swal.fire({
                title: `🎉 ${icon.iconRarity} 등급 획득!`,
                text: `[${icon.iconName}] 아이콘을 얻었습니다.`,
                imageUrl: icon.iconSrc,
                imageWidth: 100,
                imageHeight: 100,
                confirmButtonText: "확인",
                background: "#1a1a1a",
                color: "#fff",
                backdrop:
                    'rgba(0,0,123,0.4) url("https://media.giphy.com/media/26tOZ42Mg6pbMubM4/giphy.gif") center center no-repeat',
            });

            refresh();
            return true;
        } catch (e) {
            toast.error("뽑기 실패");
            return false;
        }
    },

    BASIC: async (item) => {
        const result = await swalConfirm({
            title: "아이템 사용",
            text: `[${item.pointItemName}]을(를) 사용하시겠습니까?`,
            icon: "question",
            confirmButtonText: "사용",
            cancelButtonText: "취소",
        });

        return result.isConfirmed;
    },
};

/* ===========================
   Component
=========================== */

export default function InventoryView({ ivRefreshPoint }) {
    const [ivItems, setIvItems] = useState([]);
    const setGlobalRefresh = useSetAtom(pointRefreshAtom);

    const ivLoadItems = useCallback(async () => {
        try {
            const resp = await axios.get("/point/main/store/inventory/my");
            setIvItems(resp.data);
        } catch {
            console.error("인벤토리 로드 실패");
        }
    }, []);

    const triggerAllRefresh = useCallback(() => {
        ivLoadItems();
        setGlobalRefresh((prev) => prev + 1);
        ivRefreshPoint && ivRefreshPoint();
    }, [ivLoadItems, setGlobalRefresh, ivRefreshPoint]);

    useEffect(() => {
        ivLoadItems();
    }, [ivLoadItems]);

    /* ===========================
       Use Handler (핵심)
    =========================== */

    const ivHandleUse = async (item) => {
        const type = item.pointItemType;
        let extraValue = null;

        try {
            if (type === "CHANGE_NICK") {
                extraValue = await itemHandlers.CHANGE_NICK();
                if (!extraValue) return;
            } else if (type === "RANDOM_ICON") {
                await itemHandlers.RANDOM_ICON(item, triggerAllRefresh);
                return;
            } else if (DECO_TYPES.includes(type)) {
                const ok = await itemHandlers.DECO(item);
                if (!ok) return;
            } else if (itemHandlers[type]) {
                const ok = await itemHandlers[type](item);
                if (!ok) return;
            } else {
                const ok = await itemHandlers.BASIC(item);
                if (!ok) return;
            }

            const resp = await axios.post(
                "/point/main/store/inventory/use",
                {
                    inventoryNo: item.inventoryNo,
                    extraValue,
                }
            );

            if (resp.data === "success") {
                toast.success("처리가 완료되었습니다 ✨");
                triggerAllRefresh();
            } else {
                toast.error(String(resp.data).replace("fail:", ""));
            }
        } catch {
            toast.error("처리 중 오류 발생");
        }
    };

    /* ===========================
       Other Handlers
    =========================== */

    const ivHandleUnequip = async (item) => {
        const confirm = await swalConfirm({
            title: "장착 해제",
            text: `[${item.pointItemName}] 장착을 해제하시겠습니까?`,
            icon: "warning",
            confirmButtonText: "해제",
            cancelButtonText: "취소",
        });

        if (!confirm.isConfirmed) return;

        try {
            const resp = await axios.post(
                "/point/main/store/inventory/unequip",
                { inventoryNo: item.inventoryNo }
            );

            if (resp.data === "success") {
                toast.success("장착 해제되었습니다.");
                triggerAllRefresh();
            } else toast.error("해제 실패");
        } catch {
            toast.error("오류 발생");
        }
    };

    const ivHandleCancel = async (item) => {
        const confirm = await swalConfirm({
            title: "구매 취소/환불",
            text: "정말 환불하시겠습니까? 포인트가 즉시 복구됩니다.",
            icon: "warning",
            confirmButtonText: "환불하기",
            cancelButtonText: "취소",
        });

        if (!confirm.isConfirmed) return;

        try {
            await axios.post("/point/main/store/cancel", {
                inventoryNo: item.inventoryNo,
            });
            toast.info("환불 처리 완료 💸");
            triggerAllRefresh();
        } catch {
            toast.error("환불 실패");
        }
    };

    const ivHandleDiscard = async (item) => {
        const confirm = await swalConfirm({
            title: "아이템 버리기",
            text: "정말 이 아이템을 삭제하시겠습니까? (복구 불가)",
            icon: "error",
            confirmButtonColor: "#d33",
            confirmButtonText: "네, 버립니다",
            cancelButtonText: "취소",
        });

        if (!confirm.isConfirmed) return;

        try {
            await axios.post("/point/main/store/inventory/delete", {
                inventoryNo: item.inventoryNo,
            });
            toast.success("아이템을 버렸습니다.");
            ivLoadItems();
        } catch {
            toast.error("삭제 실패");
        }
    };

    /* ===========================
       Render
    =========================== */

    return (
        <div className="iv-container mt-3">
            <h5 className="text-white fw-bold mb-4 px-2">
                🎒 나의 보관함{" "}
                <span className="text-secondary small">
                    ({ivItems.length})
                </span>
            </h5>

            {ivItems.length === 0 ? (
                <div className="iv-empty">
                    <span className="iv-empty-icon">📦</span>
                    <h5>보관함이 비어있습니다.</h5>
                    <p>스토어에서 아이템을 구매해보세요!</p>
                </div>
            ) : (
                <div className="iv-grid">
                    {ivItems.map((item) => {
                        const isEquipped =
                            item.inventoryEquipped === "Y";
                        const isDeco = DECO_TYPES.includes(
                            item.pointItemType
                        );

                        return (
                            <div
                                className={`iv-card ${
                                    isEquipped
                                        ? "iv-equipped-card"
                                        : ""
                                }`}
                                key={item.inventoryNo}
                            >
                                <div className="iv-img-box">
                                    {item.pointItemSrc ? (
                                        <img
                                            src={item.pointItemSrc}
                                            className="iv-img"
                                            alt={item.pointItemName}
                                        />
                                    ) : (
                                        <div className="iv-no-img">
                                            No Img
                                        </div>
                                    )}
                                    <span className="iv-count-badge">
                                        x{item.inventoryQuantity}
                                    </span>
                                    {isEquipped && (
                                        <span className="iv-equipped-overlay">
                                            ON
                                        </span>
                                    )}
                                </div>

                                <div className="iv-info">
                                    <h6
                                        className="iv-name"
                                        title={item.pointItemName}
                                    >
                                        {item.pointItemName}
                                    </h6>
                                    <span className="iv-type">
                                        {item.pointItemType}
                                    </span>
                                </div>

                                <div className="iv-actions">
                                    <button
                                        className="iv-btn iv-btn-use"
                                        onClick={() =>
                                            ivHandleUse(item)
                                        }
                                        disabled={isEquipped && isDeco}
                                    >
                                        {item.pointItemType ===
                                        "RANDOM_ICON"
                                            ? "뽑기"
                                            : isDeco
                                            ? isEquipped
                                                ? "사용중"
                                                : "장착"
                                            : "사용"}
                                    </button>

                                    {isEquipped && isDeco && (
                                        <button
                                            className="iv-btn iv-btn-unequip"
                                            onClick={() =>
                                                ivHandleUnequip(item)
                                            }
                                        >
                                            해제
                                        </button>
                                    )}

                                    {!isEquipped && (
                                        <>
                                            <button
                                                className="iv-btn iv-btn-refund"
                                                onClick={() =>
                                                    ivHandleCancel(item)
                                                }
                                            >
                                                환불
                                            </button>
                                            <button
                                                className="iv-btn iv-btn-delete"
                                                onClick={() =>
                                                    ivHandleDiscard(item)
                                                }
                                            >
                                                버리기
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
