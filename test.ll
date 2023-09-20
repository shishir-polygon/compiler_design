@.str = private unnamed_addr constant [4 x i8] c"%d\0A\00"
define i32 @main() {
%a = alloca i32
store i32 20, i32* %a
%t0 = load i32, i32* %a
%t1 = add i32 %t0, 30
store i32 %t1, i32* %a
%t3 = icmp eq i32 %t1, 60
; Code for if block
store i32 100, i32* %a
%t5 = load i32, i32* %a
call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([4 x i8], [4 x i8]* @.str, i64 0, i64 0), i32 %t5)
ret i32 0
}
declare i32 @printf(i8*, ...)
