import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export default function IconListView({ refreshPoint }) {
    // 물음표 이미지
    const questionImg = 'https://upload.wikimedia.org/wikipedia/commons/5/55/Question_Mark.svg';
    
    const [myIcons, setMyIcons] = useState([]);
    const [allIcons, setAllIcons] = useState([]);

    const loadMyIcons = async () => {
        try {
            const {data} = await axios.get("/point/icon/my");
            setMyIcons(data);
        } catch(err){ console.error(err); }
    };

    const loadAllIcons = useCallback(async()=>{
        try{
            const {data} = await axios.get("/point/icon/all");
            setAllIcons(data);
        }
        catch(err){
            console.log(err)
        }
    },[])

const resultIconList = useMemo(() => {
  const myIconMap = new Map(
        myIcons.map(icon => [Number(icon.iconId), icon])
    );

    return allIcons.map(allIcon => ({
        ...allIcon,
        isOwned: myIconMap.has(Number(allIcon.iconId)),
    }));
}, [allIcons, myIcons]);


    useEffect(() => {
        loadMyIcons();
        loadAllIcons();
    }, []);

    useEffect(() => {
        console.log("resultIconList", resultIconList);
    }, [resultIconList]);



    return (
        <div className="p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0"> 전체 아이콘 도감</h5>
            </div>

            <div className="row g-3">
                {resultIconList.map((icon) => {

                    return (
                        <div className="col-4 col-sm-3 col-md-2 text-center" key={icon.iconId}>
                            {icon.isOwned ? (
                                // 아이콘 보유중일때
                                <div 
                                className={`card h-100 shadow-sm icon-card  border-0}`}
                                style={{cursor: 'pointer', transition: 'transform 0.2s'}}
                                onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                                onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                            >

                                <div className="card-body p-2 d-flex flex-column align-items-center justify-content-center">
                                    <img 
                                        src={icon.iconSrc}  className="mb-2"  style={{width: '50px', height: '50px', objectFit: 'contain'}} 
                                        alt={icon.iconName} onError={(e)=>{e.target.src='https://placehold.co/50x50?text=IMG'}} 
                                    />
                                    
                                    <span className={`badge mb-1 ${
                                        icon.iconRarity === 'LEGENDARY' ? 'bg-warning text-dark border border-dark' :
                                        icon.iconRarity === 'UNIQUE'    ? 'bg-purple text-white' :
                                        icon.iconRarity === 'EPIC'      ? 'bg-danger' :
                                        icon.iconRarity === 'RARE'      ? 'bg-primary' :
                                        icon.iconRarity === 'EVENT'     ? 'bg-event' : 
                                        icon.iconRarity === 'COMMON'    ? 'bg-success' : 
                                        'bg-secondary'
                                    }`} style={{fontSize:'0.6rem'}}>
                                        {icon.iconRarity}
                                    </span>
                                    
                                    <small className="text-dark fw-bold text-truncate w-100" style={{fontSize: '0.75rem'}}>
                                        {icon.iconName}
                                    </small>
                                </div>
                            </div>
                            ) : (
                                // 아이콘 보유중이 아닐때
                                <div 
                                className={`card h-100 shadow-sm icon-card  border-0}`}
                                style={{cursor: 'pointer', transition: 'transform 0.2s', backgroundColor:`gray`}}
                                onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                                onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                            >
                                <div className="card-body p-2 d-flex flex-column align-items-center justify-content-center">
                                    <img src={questionImg} className="mb-2"
                                            style={{ width: '50px', height: '50px', objectFit: 'contain' }} alt={icon.iconName} 
                                            onError={(e) => {
                                                e.target.onerror = null; // 무한루프 방지
                                                e.target.src = {questionImg};
                                            }}
                                            />
  
                                    <span className={`badge mb-1 ${
                                        icon.iconRarity === 'LEGENDARY'? 'bg-warning text-dark border border-dark' :
                                        icon.iconRarity === 'UNIQUE' ? 'bg-purple text-white' :
                                        icon.iconRarity === 'EPIC'? 'bg-danger' :
                                        icon.iconRarity === 'RARE'  ? 'bg-primary' :
                                        icon.iconRarity === 'EVENT' ? 'bg-event' : 
                                        icon.iconRarity === 'COMMON' ? 'bg-success' : /* ★ 여기도 추가 */
                                        'bg-secondary'
                                    }`} style={{fontSize:'0.6rem'}}>
                                        {icon.iconRarity}
                                    </span>
                                    
                                    <small className="text-light fw-bold text-truncate w-100" style={{fontSize: '0.75rem'}}>
                                        {icon.iconName}
                                    </small>
                                </div>
                            </div>

                            )}
                            
                            
                            
                        </div>
                    );
                })}
            </div>

        </div>
    );
}