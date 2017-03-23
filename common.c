#include "common.h"
#include <stdio.h>
#include <stdlib.h>
#include <stdarg.h>
#include <limits.h>

#ifdef WIN_X64
double gettimenow(){
    LARGE_INTEGER m_nFreq;  
    LARGE_INTEGER m_nNow;  
    QueryPerformanceFrequency(&m_nFreq);
    QueryPerformanceCounter(&m_nNow);
    return (double)(m_nNow.QuadPart)/m_nFreq.QuadPart;  
}
#else
double gettimenow(){
    struct timeval now;
    gettimeofday(&now, NULL );
    return (1000000* now.tv_sec+ now.tv_usec)/1000000.0;
}
#endif
int LOG(int loglvl, const char* file, int line, char* format, ...){
    va_list args;
    if( loglvl> _LOGLVL_) return 0;
    if( loglvl== 1) printf("[TRACE][%s][%d]", file, line);
    else if( loglvl== 2) printf("[DEBUG][%s][%d]", file, line);
    va_start( args, format);
    vprintf( format, args);
    va_end(args);
    return 0;
}
//dump graph
void dump_graph(Graph* graph){
    size_t li, layer;
    printf("print edge list\n");
    if( graph->weighted){
        for( layer= 0; layer< graph->L; layer++){
            printf("layer[%zu]\n", layer);
            for( li= 0; li< graph->E[layer]; li++){
                printf("L[%zu]E[%zu]i[" fmt_n "]j[" fmt_n "]w[%lf]\n", layer, li, graph->edge_w[layer][li].i, 
                graph->edge_w[layer][li].j, graph->edge_w[layer][li].w);
            }
            if( graph->index!= NULL){
                printf("index:\n");
                for( NINT i = 0; i< graph->_e; i++){
                    printf("%d\n", graph->index[layer][i]);
                }
            }
        }
    }
    else{
        for( layer= 0; layer< graph->L; layer++){
            printf("layer[%zu]\n", layer);
            for( li= 0; li< graph->E[layer]; li++){
                printf("L[%zu]E[%zu]i[" fmt_n "]j[" fmt_n "]\n", layer, li, graph->edge[layer][li].i,graph->edge[layer][li].j);
            }
            if( graph->index != NULL){
                printf("index:\n");
                for( NINT i = 0; i< graph->_e; i++){
                    printf("%d\n", graph->index[layer][i]);
                }
            }
        }
    }
}
//print graph size
void print_graph_size(Graph* graph){
    size_t layer;
    printf( fmt_n" nodes start from "fmt_n"\n", graph->V, graph->_s);
    printf( "%zu layers\n", graph->L);
    for( layer= 0; layer< graph->L; layer++){
        printf( "%zu edges in layer %zu\n", graph->E[layer], layer);
    }
    printf("[node range]\t\t[ "fmt_n , graph->_s);
    kilobit_print(" - ", graph->_e - 1, " ]\n");
}
//check int range, make sure it suits the range of NINT
int check_int_range( LONG li){
    if( li> UINT_MAX){
        kilobit_print("[ ", li, " ] exceed max ");
        kilobit_print("[ ", UINT_MAX, " ], exit.\n");
        exit( - 1);
    }
    return 0;
}
//10 to the power of pow 
LONG exp10(int pow){
    LONG ret;
    int i;
    for(i= 0, ret= 1;i< pow&& i< MAX_INT_LEN; i++)
        ret= ret* 10;
    return ret;
}
//format print time
int time_print( char* prefix, double val, char* suffix){
    int day, hour, min, sec, msec;
    day= (int)val;
    msec= (int)(val*100 - day*100);
    sec= day%60;
    day/= 60;
    min= day%60;
    day/= 60;
    hour= day%24;
    day/= 24;
    printf("%s", prefix);
    if( day> 0) printf("%d d:%d h:%d m:%d.%02d s%s", day, hour, min, sec, msec, suffix);
    else if( hour> 0) printf("%d h:%d m:%d.%02d s%s", hour, min, sec, msec, suffix);
    else if( min> 0) printf("%d m:%d.%02d s%s", min, sec, msec, suffix);
    else printf("%d.%02d s%s", sec, msec, suffix);
    return 0;
}
//print number with kilobit
int kilobit_print( char* prefix, LONG val, char* suffix){
    int len, j, div;
    LONG lef;
    printf("%s", prefix);
    if( val< 0){
        printf("-");
        val= - val;
    }
    for(len= 1; len< MAX_INT_LEN; len++)
        if(!(val/ exp10(len))) break;
    for(j= 0; j< len; j++){
        div= (int)(val/ exp10( len- j- 1));
        lef= val% exp10( len- j- 1);
        if(j== 0) printf("%c", '0'+ div);
        else{
            if(j% 3== len% 3) printf(",");
            printf("%c", '0'+ div);
        }
        val= lef;
    }
    printf("%s", suffix);
    return 0;
}
//dump transition matrices
void dump_transition( Transition* tran){
    size_t i, j, k;
    printf("L: %zu\nM: %zu\nStart: %zu\n", tran->L, tran->M, tran->_s);
    printf("dump transition parameters begin\ninducer list");
    for( i= 0; i< tran->L; i++){
        printf(" %zu", tran->inducer_lst[i]);
    }
    printf("\n%s\n", "nodal transition rate matrix");
    for( j= tran->_s; j< tran->M+tran->_s; j++){
        for( k= tran->_s; k< tran->M+tran->_s; k++){
            printf("%.2g\t", tran->nodal_trn[j][k]);
        }
        printf("\n");
    }
    printf("%s\n", "edge based transition rate matrix");
    for( i= 0; i< tran->L; i++){
        for( j= tran->_s; j< tran->M+tran->_s; j++){
            for( k= tran->_s; k< tran->M+tran->_s; k++){
                printf("%.2g\t", tran->edge_trn[i][j][k]);
            }
            printf("\n");
        }
        printf("\n");
    }
    printf("dump transition parameters end\n");
}
//dump status infor
void dump_status( Status* sts){
    NINT i;
    printf("initial status list\n");
    for( i= sts->_node_s; i< sts->_node_e; i++){
        printf("["fmt_n"][%zu]\n", i, sts->init_lst[i]);
    }
    printf("initial status count\n");
    for( i= sts->_node_s; i< sts->_node_e; i++){
        printf("[" fmt_n "][" fmt_n "]\n", i, sts->init_cnt[i]);
    }
}
