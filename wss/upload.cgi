#!/usr/bin/perl -wT

use strict;
use CGI;
use CGI::Carp qw ( fatalsToBrowser );
use File::Basename;
use Config::Tiny;

# Create a config object
my $config = Config::Tiny->new;
# Open the config file (this file MUST be in the same dir as this perl program)
$config = Config::Tiny->read( 'pwsc.conf' );
my $upload_dir = $config->{_}->{upload_dir};

$CGI::POST_MAX = 256000;

my $query = new CGI;
my $filename = $query->param("photo");

if(!$filename){
    print $query->header();
    print "ERRORtoobig";
    exit;
}

my $safe_filename_characters = "a-zA-Z0-9_.-";
my($name, $path, $extension) = fileparse($filename, '..*');
$filename = $name . $extension;
$filename =~ tr/ /_/;
$filename =~ s/[^$safe_filename_characters]//g;

if($filename =~ /^([$safe_filename_characters]+)$/){
    $filename = $1;
}else{
    die "Filename contains invalid characters";
}

my $upload_filehandle = $query->upload("photo");

open(UPLOADFILE, ">$upload_dir/$filename") or die "$!";
binmode UPLOADFILE;

while(<$upload_filehandle>){
    print UPLOADFILE;
}

close UPLOADFILE;

print $query->header();
print $filename;