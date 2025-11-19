import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, Clock, BookOpen, BarChart3, Target } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import lyubishchevPortrait from "@/assets/lyubishchev-portrait.jpg";

export const HowToUseDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="default" 
          size="sm"
          className="bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg whitespace-nowrap"
        >
          <HelpCircle className="h-4 w-4 mr-2" />
          시간명세서 사용방법
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold text-center">
            시간을 정복한 남자, 류비셰프
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[calc(90vh-100px)]">
          <div className="p-6 space-y-8">
            {/* Hero Section */}
            <div className="flex flex-col md:flex-row gap-6 items-center p-6 rounded-xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/20">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/30 flex-shrink-0">
                <img 
                  src={lyubishchevPortrait} 
                  alt="Aleksandr Lyubishchev" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold mb-2">알렉산드르 류비셰프</h3>
                <p className="text-muted-foreground text-sm mb-2">Aleksandr Lyubishchev (1890-1972)</p>
                <p className="text-sm leading-relaxed">
                  구소련의 생물학자이자 철학자. <span className="font-semibold text-primary">56년간 하루도 빠짐없이</span> 
                  자신의 시간 사용을 기록하고 분석한 시간 통계법의 창시자입니다.
                </p>
              </div>
            </div>

            {/* Quote */}
            <blockquote className="border-l-4 border-primary pl-4 py-2 italic text-muted-foreground">
              "가장 소중한 것은 인생이다. 그러나 자세히 들여다보면 가장 소중한 것은 시간이다. 
              왜냐하면 인생은 시간으로 구성되어 있기 때문이다."
            </blockquote>

            {/* Main Content */}
            <div className="space-y-6">
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-bold">류비셰프의 시간 통계법</h3>
                </div>
                <div className="space-y-3 pl-7">
                  <div className="p-4 rounded-lg bg-card border">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">1</span>
                      정직한 기록
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      모든 활동을 분 단위로 정직하게 기록합니다. 
                      연구 중 잡담이나 휴식 시간은 철저히 제외하고 '순수 시간'만 계산했습니다.
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-card border">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">2</span>
                      카테고리 분류
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      연구, 독서, 휴식, 운동 등 활동을 카테고리로 나누어 관리합니다.
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-card border">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">3</span>
                      월간/연간 결산
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      매일의 기록을 바탕으로 월말과 연말에 통계를 내고, 
                      다음 달의 계획을 세웁니다.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-bold">놀라운 성과</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 pl-7">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">70권</div>
                    <div className="text-xs text-muted-foreground">학술 서적 저술</div>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border border-purple-200 dark:border-purple-800">
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">12,500장</div>
                    <div className="text-xs text-muted-foreground">연구 논문 (단행본 100권 분량)</div>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border border-green-200 dark:border-green-800 col-span-2">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">8-10시간</div>
                    <div className="text-xs text-muted-foreground">매일 충분한 수면과 휴식을 유지하며 이룬 성과</div>
                  </div>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-bold">삶의 원칙</h3>
                </div>
                <ul className="space-y-2 pl-7">
                  {[
                    "피로를 느끼면 즉시 일을 중단하고 휴식한다",
                    "힘든 일과 즐거운 일을 적당히 섞어서 한다",
                    "의무적이거나 시간에 쫓기는 일은 맡지 않는다",
                    "매일 충분히(8~10시간) 잠을 잔다"
                  ].map((principle, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-1">•</span>
                      <span>{principle}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="p-6 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <h3 className="text-lg font-bold">1964년 4월 7일 기록 예시</h3>
                </div>
                <div className="space-y-2 text-sm pl-7">
                  <p><span className="font-semibold">곤충분류학:</span> 알 수 없는 곤충 그림 두 점을 그림. <span className="text-primary font-semibold">3시간 15분</span></p>
                  <p><span className="font-semibold">조사:</span> 어떤 곤충인지 조사함. <span className="text-primary font-semibold">20분</span></p>
                  <p><span className="font-semibold">추가 업무:</span> 슬라바에게 편지. <span className="text-primary font-semibold">2시간 45분</span></p>
                  <p><span className="font-semibold">휴식:</span> 톨스토이의 {'<'}세바스토폴 이야기{'>'} 읽음. <span className="text-primary font-semibold">1시간 25분</span></p>
                </div>
              </section>

              <section className="text-center p-6 rounded-xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/20">
                <p className="text-sm italic text-muted-foreground mb-2">
                  "나는 시간을 관리하려 들지 않고, 그저 시간을 살았다."
                </p>
                <p className="text-xs text-muted-foreground">
                  류비셰프의 방법을 통해 여러분도 시간과 친구가 되어보세요.
                </p>
              </section>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};